// const monitorUrl = 'https://peoplesopen.herokuapp.com/api/v0/nodes';
// need to add CORS header to the monitor API response if we want to hit that.
// developing with a downloaded json for now.
const monitorUrl = 'nodes.json';

function nodeJsonToIPList(exitnodes) {
  // turn the routing table json into a list of unique home node IPs
  let routingTable = exitnodes.find((exitnode) => exitnode.exitnodeIP === '64.71.176.94').routingTable;
  let mostRecentTimestamp = routingTable[0].timestamp;
  let homenodeSubnets = routingTable.filter((route) => route.timestamp === mostRecentTimestamp)
    .map((route) => route.nodeIP)
    // we're just looking for homenodes, all of which have /26 subnets
    .filter((ip) => ip.endsWith('/26'));
  let uniqueIPs = _.unique(homenodeSubnets)
    .map((subnetAddress) => subnetAddress.substring(0, subnetAddress.length - 3));
  console.log(uniqueIPs);
  
  // explode list of unique IPs into one concatenated list of every IP in its /26 subnet range
  return _.flatten(uniqueIPs.map((networkAddress) => {
    let numAddresses = 64; // 2^(32-26)
    let networkPrefix = networkAddress.split('.').slice(0,3);
    let lastOctet = parseInt(networkAddress.split('.')[3]);
    return _.range(numAddresses).map((i) => {
      return networkPrefix.concat([lastOctet + i]).join('.');
    })
  }));
}

const ipScanResults = {};
function scanIP(ip) {
  const whoAreYouPath = '/waldo';
  const serviceUrl = `http://${ip}${whoAreYouPath}`;
  console.log('scanning ' + serviceUrl);
  
  // abort fetches that don't return in scanTimeout millis
  const fetchTimeout = 5000;
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), fetchTimeout);

  return fetch(serviceUrl, { signal })
    .then((response) => {
      if (response.ok) {
        response.text((text) => {
          ipScanResults[ip] = { ok: true, text: text };
        })
      } else {
        ipScanResults[ip] = { ok: false };
      }
    })
    .catch((error) => {
      if (error.name === 'AbortError') {
        console.log(`Fetch ${serviceUrl} took longer than 5s. Aborting.`);
      } else {
        console.log(`Error fetching ${serviceUrl}`);
      }
      ipScanResults[ip] = { ok: false };
    });
}

function updateView() {
  document.querySelector('.num-services-found').innerText = `Scanned ${viewModel.numScanned} of ${viewModel.numToScan} ips and found ${viewModel.numServicesFound} services.`;
  if (viewModel.numScanned === viewModel.numToScan) {
    document.querySelector('.current-batch').innerText = `Done scanning.`;
  } else {
    document.querySelector('.current-batch').innerText = `Currently scanning batch ${viewModel.currentBatch.start}-${viewModel.currentBatch.end}.`;
  }
}

const viewModel = {
  currentBatch: { start: null, end: null },
  numScanned: 0,
  numToScan: 0,
  numServicesFound: 0
};
function init() {
  fetch(monitorUrl, { mode: 'cors' })
    .then(async (response) => {
      let nodeJson = await response.json();
      let ipsToScan = nodeJsonToIPList(nodeJson);
      // maybe should randomize the list of IPs so as not to
      // stress out individual home nodes with a bunch of requests all at once?
      
      // scan ips batch by batch so that the DOM has a chance to update
      let batchSize = 5; // how many IPs to scan at once
      let numBatches = Math.ceil(ipsToScan.length / batchSize);
      viewModel.numToScan = ipsToScan.length;
      console.log('Beginning scan');
      for (let i of _.range(numBatches)) {
        console.log(i);
        let start = i*batchSize;
        let end = (i+1)*batchSize;
        viewModel.currentBatch = { start, end };
        updateView();
        await Promise.all(ipsToScan.slice(start, end).map(scanIP));
        viewModel.numScanned = Object.keys(ipScanResults).length;
        viewModel.numServicesFound = _.filter(ipScanResults, (result) => result.ok).length;
        console.log(`Finished batch ${viewModel.currentBatch.start}-${viewModel.currentBatch.end}.`);
      }
      updateView();
    })
    .catch((error) => {
      console.error(error);
    });
}

init();
