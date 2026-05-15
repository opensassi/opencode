# ubuntu-noble-24.04 install.sh spec

## 1. Overview

**Role**: Installs full development toolchain on Ubuntu 24.04 LTS noble. 50+ apt packages, pip3 gdb-mcp-server, npm install, verification table.

**Language**: Shell (Bash, set -euo pipefail)

**Lifecycle**: apt update, apt install 50 packages, pip3 install gdb-mcp-server, npm install, verification table

**Cross-references**: Called by scripts/install.sh OS dispatcher and WSL2 installer inside WSL.

## 2. Component Specifications

```
Usage: bash scripts/install/linux/ubuntu-noble-24.04/install.sh
```

## 3. System Architecture

```mermaid
graph TB
    subgraph Pkgs[Apt Packages]
        Build[build-essential cmake nasm git]
        Search[ripgrep fd-find bat fzf]
        Perf[hyperfine linux-tools]
        Net[httpie whois nmap mtr]
        Dev[tmux jq curl wget ssh]
        Debug[gdb python3-pip]
    end
    Install[apt update + install] --> Pip[pip3 install gdb-mcp-server]
    Pip --> NPM[npm install]
    NPM --> Verify[Verification table]
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant Script as install.sh
    participant APT as apt
    participant pip as pip3
    participant npm as npm

    Script->>APT: sudo apt update
    Script->>APT: sudo apt install -y 50 packages
    APT->>Script: all packages installed
    Script->>pip: pip3 install gdb-mcp-server
    Script->>npm: npm install
    Script->>Script: print verification table
```

## 5. Visualization

### Animation Source

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ubuntu Installer</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>body{font-family:monospace;background:#1e1e2e;color:#cdd6f4;margin:0;padding:20px}
.controls{margin-bottom:15px}.controls button{background:#45475a;color:#cdd6f4;border:1px solid #585b70;padding:6px 16px;cursor:pointer}
.controls span{margin:0 12px;font-size:13px;color:#a6adc8}
#vis{width:680px;height:320px;border:1px solid #45475a;background:#181825;overflow:hidden}
.log{margin-top:10px;max-height:80px;overflow-y:auto;font-size:11px;color:#a6adc8}
</style>
</head><body>
<div class="controls"><button id="play-pause" data-testid="play-pause">Play</button><button id="replay">Replay</button><span id="kf-label">0/<span id="kf-total">0</span></span></div>
<div id="vis"><svg width="680" height="320"><g id="s"></g></svg></div><div class="log" id="log"></div>
<script>
(function(){const kf=[{time:0,label:'idle'},{time:600,label:'apt-update'},{time:2000,label:'apt-install'},{time:3800,label:'pip-npm'},{time:5000,label:'verify'},{time:6000,label:'done'}];const vf=[{label:'idle',hor:0,ver:0,precision:0,logCount:0},{label:'apt-update',hor:1,ver:0,precision:0,logCount:1},{label:'apt-install',hor:1,ver:1,precision:0,logCount:2},{label:'pip-npm',hor:2,ver:1,precision:1,logCount:3},{label:'verify',hor:3,ver:2,precision:2,logCount:4},{label:'done',hor:4,ver:3,precision:3,logCount:5}];const T=6000;window.ANIMATION_DURATION_MS=T;window.ANIMATION_KEYFRAMES=kf;window.ANIMATION_VERIFICATION=vf;let ck=0,pl=false,tm=null;const sv=d3.select('#vis svg'),lg=document.getElementById('log'),pb=document.getElementById('play-pause'),rb=document.getElementById('replay'),kl=document.getElementById('kf-label'),kt=document.getElementById('kf-total');kt.textContent=kf.length-1;function jk(idx){if(idx<0||idx>=kf.length)return;pl=false;pb.textContent='Play';if(tm){clearInterval(tm);tm=null}ck=idx;kl.textContent=idx+'/'+(kf.length-1);const g=sv.select('#s');g.selectAll('*').remove();const ee=['Ubuntu installer: waiting','Ubuntu installer: apt update','Ubuntu installer: installing 50 packages','Ubuntu installer: pip3 + npm','Ubuntu installer: verification table','Ubuntu installer: done'];for(let i=0;i<=Math.min(idx,5);i++){const d=document.createElement('div');d.textContent=ee[i];lg.appendChild(d)}if(idx>0){const n=Math.min(idx,5);for(let j=0;j<n;j++){const y=35+j*48;g.append('rect').attr('x',30).attr('y',y).attr('width',350).attr('height',34).attr('fill','#313244').attr('stroke',j===n-1?'#f9e2af':'#585b70').attr('rx',4);g.append('text').attr('x',205).attr('y',y+20).attr('fill','#cdd6f4').attr('font-size','11').attr('text-anchor','middle').text(ee[idx].replace('Ubuntu installer: ',''))}}}window.jumpToKeyframe=jk;window.resetAnimation=function(){jk(0)};window.getAnimationState=function(){const v=vf[ck]||vf[0];return{hor:v.hor,ver:v.ver,precision:v.precision,boundsOpacity:0,logCount:v.logCount,keyframeIdx:ck,keyframeLabel:kf[ck].label}};jk(0);pb.addEventListener('click',function(){if(pl){pl=false;pb.textContent='Play';if(tm){clearInterval(tm);tm=null}}else{pl=true;pb.textContent='Pause';if(ck>=kf.length-1)ck=0;const stp=T/(kf.length-1);tm=setInterval(()=>{if(ck<kf.length-1)jk(ck+1);else{pl=false;pb.textContent='Play';clearInterval(tm);tm=null}},stp)}});rb.addEventListener('click',function(){jk(0);pl=true;pb.textContent='Pause';const stp=T/(kf.length-1);tm=setInterval(()=>{if(ck<kf.length-1)jk(ck+1);else{pl=false;pb.textContent='Play';clearInterval(tm);tm=null}},stp)});})();
</script>
</body></html>
```

## 6. Testing Requirements

| Test ID | Scenario | Expected |
|---------|----------|----------|
| UL01 | Run on Ubuntu 24.04 | All packages installed |
| UL02 | Re-run idempotent | Packages already present, verification shown |
| UL03 | Run on non-Ubuntu | apt commands may fail |
