
// includes
const cmd = require("commander");
const request = require("request");
const cheerio = require("cheerio");
const xml = require("xml-js");

// setup command line arguments
cmd
    .version("0.1.0");

function retrieve() {
    return new Promise((resolve, reject) => {
            
        // request page
        request({
            method: "GET",
            uri: "https://www.microsoft.com/en-us/download/confirmation.aspx?id=41653",
        }, (error, response, body) => {
            if (!error && response.statusCode >= 200 && response.statusCode <= 299) {

                // load the HTML content (xmlMode allows looking inside <noscript />)
                const $ = cheerio.load(body, {
                    xmlMode: true
                });

                // find the <a /> element under the "file-link" class, then the URL
                const a = $(".file-link a");
                const url = a.attr("href");

                // download the XML document
                request({
                    method: "GET",
                    uri: url
                }, (error, response, body) => {
                    if (!error && response.statusCode >= 200 && response.statusCode <= 299) {

                        // convert body to JS object
                        const jso = xml.xml2js(body, {
                            compact: true
                        });
                        resolve(jso);

                    } else if (error) {
                        reject(error);
                    } else {
                        reject(new Error(`${response.statusCode}: ${response.statusMessage}`));
                    }
                });

            } else if (error) {
                reject(error);
            } else {
                reject(new Error(`${response.statusCode}: ${response.statusMessage}`));
            }
        });

    });
}

// list region codes
cmd
    .command("regions")
    .description("List all region codes.")
    .action(_ => {

        // retrieve the file
        retrieve().then(json => {

            // find all CIDR for a region
            const list = [];
            for (let region of json.AzurePublicIpAddresses.Region) {
                console.log(region._attributes.Name);
            }

        }).catch(ex => {
            console.error(ex);
        });

    });

// list IPs in region
cmd
    .command("cidr <code>")
    .description("List all CIDR for a specific region code.")
    .action(code => {

        // retrieve the file
        retrieve().then(json => {

            // find all CIDR for a region
            for (let region of json.AzurePublicIpAddresses.Region) {
                if (region._attributes.Name === code) {
                    for (let range of region.IpRange) {
                        console.log(range._attributes.Subnet);
                    }
                }
            }

        }).catch(ex => {
            console.error(ex);
        });

    });

// parse command line options
cmd.parse(process.argv);