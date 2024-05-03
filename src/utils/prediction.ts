import Replicate from "replicate";
import axios from "axios";
import { pricePerInputToken, pricePerOutputToken } from "../const";
import { minimalBalance, pricePsec } from "../const";
import { Llama2Tokenizer } from "@lenml/llama2-tokenizer";
import { load_vocab } from "@lenml/llama2-tokenizer-vocab-llama2"

async function tokenize(text:string) {
  const llamaTokenizer = new Llama2Tokenizer()
  const vocab = load_vocab()
  llamaTokenizer.install_vocab(vocab)
  const tokens = llamaTokenizer.tokenize(text)
  return tokens.length
}

async function calculateCost(input:string, output:string,model:string) {
  const inputCost = pricePerInputToken[model]
  const outputCost = pricePerOutputToken[model]
  const inputTokens = await tokenize(input)
  const outputTokens = await tokenize(output)
  const inputTotal = inputTokens * inputCost
  const outputTotal = outputTokens * outputCost
  return inputTotal + outputTotal
}

async function uploadCDN(output: string) {
  const ext = output.split('.').pop();
  const filename = `file-${Date.now()}.${ext}`;
  const url = `https://storage.bunnycdn.com/tpu-marketplace/output/${filename}`;
  try {
    const response = await axios.get(output, { responseType: 'stream' });
    const req = await axios.put(url, response.data, {
        headers: {
            AccessKey: process.env.BUNNYCDN_ACCESS_KEY as string,
            'Content-Type': 'application/octet-stream',
        },
    });
    if(req.status === 201)  return `${process.env.BUNNYCDN_EDGE_URL}/output/${filename}`;
    else return null;
  } catch (e: any) {
    console.log(e);
    return null;
  }
}

async function replaceCDN(output: any): Promise<any> {
  if (typeof output === 'string' && output.includes("https://replicate.delivery")) {
    return await uploadCDN(output);
  }
  if (Array.isArray(output)) {
    const modifiedOutput = await Promise.all(output.map(async (item) => {
      if (typeof item === 'string' && item.includes("https://replicate.delivery")) {
        return await uploadCDN(item);
      } else if (typeof item === 'object' && item !== null) {
        return await replaceCDN(item); // Recursively traverse arrays
      } else {
        return item;
      }
    }));
    return modifiedOutput;
  } else if (typeof output === 'object' && output !== null) {
    const modifiedOutput: any = {};
    for (const key in output) {
      if (Object.prototype.hasOwnProperty.call(output, key)) {
        if (typeof output[key] === 'string' && output[key].includes("https://replicate.delivery")) {
          modifiedOutput[key] = await uploadCDN(output[key]);
        } else {
          modifiedOutput[key] = await replaceCDN(output[key]); // Recursively traverse dictionaries
        }
      }
    }
    return modifiedOutput;
  } else {
    return output;
  }
}

export async function runModel(model_name: string, input: any) {
  let issuedBalance = 0;
  let issuedTime = 0;
  let output;
  const startTime = Date.now()

  if(model_name === "gpt-3.5-turbo") {
    const result = await (await fetch("https://api.openai.com/v1/chat/completions",{
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model_name,
        "messages":[
          {
            "role": "system",
            "content": input.system_prompt
          },
          {
            "role": "user",
            "content": input.prompt
          }
        ],
        "temperature": 0.7
      })
    })).json();
    output = result["choices"][0]["message"]["content"];
    issuedTime = (Date.now() - startTime + 999) / 1000;
    if (model_name in pricePerInputToken) {
      issuedBalance = await calculateCost(input.prompt, (output as any).join(''), model_name)
    }

  } else {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY as string,
    });

    output = await replicate.run(
      model_name as any,
      {
        input: input
      }
    );
    issuedTime = (Date.now() - startTime + 999) / 1000;
    issuedBalance = issuedTime * pricePsec.nvidia_a40_1x_48gb_10x_72gb

    output = await replaceCDN(output);
  }

  return {output, issuedTime, issuedBalance};
}