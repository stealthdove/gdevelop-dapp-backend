export const pricePsec = {
  'cpu_4x_8gb': 0.0001,
  'nvidia_t4_1x_16gb_4x_8gb': 0.000225,
  'nvidia_a40_1x_48gb_4x_16gb': 0.000575,
  'nvidia_a40_1x_48gb_10x_72gb': 0.000725,
  'nvidia_a100_1x_40gb_10x_72gb': 0.00115,
  'nvidia_a100_1x_80gb_10x_144gb': 0.0014,
  'nvidia_a40_8x_384gb_48x_640gb': 0.0058,
}

export const pricePerInputToken: { [key: string]: number } = {
  "meta/llama-2-70b": 0.65 / 1000000,
  "meta/llama-2-13b": 0.1 / 1000000,
  "meta/llama-2-7b": 0.05 / 1000000,
  "meta/llama-2-70b-chat": 0.65 / 1000000,
  "meta/llama-2-13b-chat": 0.1 / 1000000,
  "meta/llama-2-7b-chat": 0.05 / 1000000,
  "mistralai/mistral-7b-v0.1": 0.05 / 1000000,
  "mistralai/mistral-7b-instruct-v0.2": 0.05 / 1000000,
  "mistralai/mixtral-8x7b-instruct-v0.1": 0.03 / 1000000
};

export const pricePerOutputToken:{ [key: string]: number } = {
  "meta/llama-2-70b": 2.75 / 1000000,
  "meta/llama-2-13b": 0.5 / 1000000,
  "meta/llama-2-7b": 0.25 / 1000000,
  "meta/llama-2-70b-chat": 2.75 / 1000000,
  "meta/llama-2-13b-chat": 0.5 / 1000000,
  "meta/llama-2-7b-chat": 0.25 / 1000000,
  "mistralai/mistral-7b-v0.1": 0.25 / 1000000,
  "mistralai/mistral-7b-instruct-v0.2": 0.25 / 1000000,
  "mistralai/mixtral-8x7b-instruct-v0.1": 1 / 1000000
};

export const minimalBalance = 1; // $

export const minimalChargeAmount = 10; // $