import fs from 'fs';

interface StoredData {
    [key: string]: any;
}

function storeDataToFileStorage(inputString: string, inputObject: any, filePath: string): void {
    try {
        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Read data from file
            const data: string = fs.readFileSync(filePath, 'utf8');

            // Parse the data
            let storedData: StoredData;
            try {
                storedData = data ? JSON.parse(data) : {};
            } catch (error) {
                console.error('Error parsing stored data:', error);
                storedData = {};
            }

            // Update or add the new data
            storedData[inputString] = inputObject;

            // Write the updated data back to the file
            fs.writeFileSync(filePath, JSON.stringify(storedData, null, 2));
        } else {
            // If the file doesn't exist, create a new one and store the data
            const newData: StoredData = {
                [inputString]: inputObject
            };
            fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
        }
    } catch (e) {
        console.log(e);
    }
}

async function getObjectFromString(inputString: string, filePath: string): Promise<any | null> {
    try {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err); // Reject the promise with the error
                } else {
                    try {
                        const storedData: StoredData = JSON.parse(data);
                        if (inputString in storedData) {
                            return resolve(storedData[inputString]);
                        } else {
                            console.log('Input string not found in the stored data.');
                            resolve(null); // Reject the promise with the parse error
                        }
                    } catch (parseError) {
                        reject(parseError); // Reject the promise with the parse error
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error reading or parsing file:', error);
        return null;
    }
}

export { storeDataToFileStorage, getObjectFromString };
