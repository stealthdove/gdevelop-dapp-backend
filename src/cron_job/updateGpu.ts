
import { storeDataToFileStorage } from "../utils/cache-helper";
import { prisma } from "../utils/prisma";


export = async () => {
    try {
        const instances = await prisma.machine.findMany({
            where: {
              instanceState: 1
            }
        });

        const response = await fetch('https://console.vast.ai/api/v0/instances', {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.VASTAI_KEY}`,
            }
          });
    
          const output = await response.json();
    
          const subscribedIds = instances.map(item => item.instanceId);
          const filteredInstances = output?.instances?.filter((instance: any) => subscribedIds.includes(instance.id));
          filteredInstances?.forEach((e: any)=>{
            storeDataToFileStorage(e.id, {
                portEnd: e.direct_port_end,
                ip: e.public_ipaddr,
                portStart: e.direct_port_start,
            }, 'cache.json');
          });

          return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};
