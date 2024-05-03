import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";
import { runModel } from "../utils/prediction";
// import Replicate from "replicate";

export const createWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;
      const { name, nodes, edges, sequence } = req.body;

      const workflow = await prisma.workflow.create({
        data: {
          name,
          nodes,
          edges,
          sequence,
          user: { connect: { id } }
        }
      })

      res.status(200).json(workflow) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const workflowList = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const workflows = await prisma.workflow.findMany({
        where: {
          user_id: id,
        },
        select: {
          id: true,
          name: true,
          nodes: true,
          edges: true,
          created_at: true,
          updated_at: true,
        }
      });

      const results = workflows.map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          nodes_count: workflow.nodes.length,
          edges_count: workflow.edges.length,
          created_at: workflow.created_at,
          updated_at: workflow.updated_at,
        })
      );
    

      res.status(200).json(results) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
)

export const deleteWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const workflowId = parseInt(req.params.workflow_id);

      await prisma.workflow.delete({
        where: {
          id: workflowId,
          user_id: id,
        },
      });

      res.status(200).json(true) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const save = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const workflowId = parseInt(req.params.workflow_id);
      const data = req.body;
      const workflow = await prisma.workflow.update({
        where: {
          id: workflowId,
          user_id: id
        },
        data
      })

      res.status(200).json(workflow) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const publish = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const workflowId = parseInt(req.params.workflow_id);
      const data = req.body;
      const workflow = await prisma.workflow.update({
        where: {
          id: workflowId,
          user_id: id
        },
        data:{
          ...data,
          status: true,
        }
      })

      res.status(200).json(workflow) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const get = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const workflowId = parseInt(req.params.workflow_id);
      const workflow =  await prisma.workflow.findUnique({
        where:{
          id: workflowId,
          user_id: id
        }
      })
      
      res.status(200).json(workflow) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const run = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const workflowId = parseInt(req.params.workflow_id);
      const workflow =  await prisma.workflow.findUnique({
        where:{
          id: workflowId,
          user_id: id,
        }
      })

      if(!workflow) return res.status(400).json('Workflow Not Found or not available to run.') as Response;
      if(!workflow.status) return res.status(400).json('Workflow has not been published yet.') as Response;

      const { input } = req.body;

      // const replicate = new Replicate({
      //   auth: process.env.REPLICATE_API_KEY as string,
      // });

      let _tWorkflow = workflow;

      // Find the node ID with type "workflow_constants"
      let constantsNodes: any[] = _tWorkflow.nodes.filter((node: any) => node.type === 'workflow_constants');
      if (constantsNodes.length) {
        constantsNodes.forEach((constantsNode) => {
          // Find edges with source ID equal to the constants node ID
          let relevantEdges: any[] = _tWorkflow.edges.filter((edge: any) => edge.source === constantsNode.id);
          relevantEdges.forEach((edge) => {
            const sourceHandle = edge.sourceHandle;
            const targetHandle = edge.targetHandle;
            const [targetNodeId, constInput] = targetHandle.split('-')

            // Remove the workflow_constants node and related edges
            _tWorkflow.nodes = _tWorkflow.nodes.filter((node: any) => node.id !== constantsNode.id);
            _tWorkflow.edges = _tWorkflow.edges.filter((edge: any) => edge.source !== constantsNode.id);

            // Find the target node
            const targetNodeIndex = _tWorkflow.nodes.findIndex((node: any) => node.id === targetNodeId);
            
            // Replace placeholder in the template of the target node
            if (targetNodeIndex !== -1) {
              (_tWorkflow.nodes[targetNodeIndex] as any).data.template = (_tWorkflow.nodes[targetNodeIndex] as any).data.template.replace(`{{ ${constInput} }}`, constantsNode.data.workflow_constants[sourceHandle].value);
            }
          });
        })
      }

      let node_results: any = {};
      let output: any = {};
      let source_ids = ["1"]; // Entry node ID
      while (true) {
        let entry_edges = _tWorkflow.edges.filter((edge: any) => source_ids.includes(edge.source));
        _tWorkflow.edges = _tWorkflow.edges.filter((edge: any) => !source_ids.includes(edge.source));
        source_ids = [];

        for (let i = 0; i < entry_edges.length; i++) {
          if((entry_edges[i] as any).target === "2") {  // "2" : Output node ID
            output[(_tWorkflow.nodes[1] as any).data.workflow_outputs[`${(entry_edges[i] as any).targetHandle}`].key] = node_results[`${(entry_edges[i] as any).targetHandle}`];
            continue;
          }

          let entry_node = _tWorkflow.nodes.find((node: any) => node.id === (entry_edges[i] as any).target)
          Object.keys((entry_node as any).data.supported_inputs).forEach(key => {
            let replace = '';
            if((entry_edges[i] as any).source === "1") replace = input[key];
            else replace = node_results[`${(entry_edges[i] as any).targetHandle}`];
            (entry_node as any).data.template = (entry_node as any).data.template.replace(`{{ ${key} }}`, replace)
          });

          const model = (entry_node as any).data.model.name;
          let modelInput = {}
          if (model === "gpt-3.5-turbo") {
            modelInput = {
              prompt: (entry_node as any).data.system_template,
              system_prompt: (entry_node as any).data.template
            }
          } else {
            modelInput = (entry_node as any).data.input;
          }
          const {output: result} = await runModel(model, modelInput);

          _tWorkflow.edges.filter((edge: any) => edge.source === (entry_edges[i] as any).target).forEach((edge: any) => node_results[edge.targetHandle] = result);
          source_ids.push((entry_edges[i] as any).target)
        }

        if(_tWorkflow.edges.length === 0) break;
      }

      res.status(200).json(output) as Response;
      
    } catch (error) {
      if ('name' in (error as any)) {
        if ( (error as any)['name'] === "ApiError" ) {
          return res.status(402).json({
            error: (error as any)['response']['statusText']
          }) as Response;
        }
      }
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
)