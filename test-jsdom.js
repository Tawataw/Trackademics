import { JSDOM, VirtualConsole } from 'jsdom';

const virtualConsole = new VirtualConsole();
virtualConsole.on("error", (...err) => { console.log("JSDOM ERROR:", ...err); });
virtualConsole.on("warn", (...warn) => { console.log("JSDOM WARN:", ...warn); });
virtualConsole.on("info", (...info) => { console.log("JSDOM INFO:", ...info); });
virtualConsole.on("log", (...log) => { console.log("JSDOM LOG:", ...log); });
virtualConsole.on("jsdomError", (err) => { console.log("JSDOM jsdomError:", err.message); });

JSDOM.fromURL("http://localhost:8081/", {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then(dom => {
  setTimeout(() => {
    const root = dom.window.document.getElementById("root");
    console.log("ROOT HTML:", root ? root.innerHTML.substring(0, 200) : "No root");
    process.exit(0);
  }, 4000);
});
