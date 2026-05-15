# env-check.ps1 spec

## 1. Overview

**Role**: Windows-native bootstrap environment detection (PowerShell equivalent of `env-check.sh`). Detects OS, ensures git (via winget), installs Node.js LTS via nvm-windows (CoreyButler.NVMforWindows). Outputs identical JSON schema as the Bash variant.

**Language**: PowerShell (cross-platform PowerShell 7+, also works on Windows PowerShell 5.1)

**Lifecycle**: OS detection → git install via winget → nvm-windows install → nvm install lts → JSON output

**Cross-references**: Shell twin: `env-check.sh` (same JSON schema, Unix variant). Used by `install-npm-deps.sh` (which runs after env-check ensures node is available).

## 2. Component Specifications

### CLI Interface

```
Usage: powershell -ExecutionPolicy Bypass -File env-check.ps1
```
No arguments.

### Internal Functions

| Function | Description |
|----------|-------------|
| `Setup-Node()` | Checks node ≥18; if missing, installs nvm-windows via winget, then `nvm install lts`. Writes `.nvmrc`. |

### Output JSON Format (identical to env-check.sh)

```json
{"os":"win32","distro":"windows","arch":"x64","pkg_manager":"winget","node_version":"22.0.0",...}
```

## 3. System Architecture

```mermaid
graph TB
    Detect[OS Detection: PROCESSOR_ARCHITECTURE] --> PM[Package Manager: winget/choco/scoop]
    PM --> Git[winget install Git.Git]
    Git --> NVM[winget install CoreyButler.NVMforWindows]
    NVM --> Node[nvm install lts + nvm use lts]
    Node --> JSON[ConvertTo-Json to stdout]
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    User->>PS: powershell -File env-check.ps1
    PS->>PS: detect arch, set pkg_manager=winget
    PS->>PS: git --version → not found
    PS->>winget: winget install Git.Git --silent
    winget->>PS: done
    PS->>PS: node --version → not found
    PS->>winget: winget install CoreyButler.NVMforWindows
    winget->>PS: done
    PS->>nvm: nvm install lts
    nvm->>PS: installed
    PS->>PS: ConvertTo-Json output
```

## 5. Visualization

### Animation Source

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Windows Environment Check</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
body{font-family:monospace;background:#1e1e2e;color:#cdd6f4;margin:0;padding:20px}
.controls{margin-bottom:15px}.controls button{background:#45475a;color:#cdd6f4;border:1px solid #585b70;padding:6px 16px;cursor:pointer;font-family:monospace;font-size:13px}
.controls button:hover{background:#585b70}.controls span{margin:0 12px;font-size:13px;color:#a6adc8}
#vis{width:680px;height:380px;border:1px solid #45475a;background:#181825;overflow:hidden}
.log{margin-top:10px;max-height:80px;overflow-y:auto;font-size:11px;color:#a6adc8}.log div{padding:1px 0;border-bottom:1px solid #313244}
.box{fill:#313244;stroke:#585b70;rx:4}.lbl{fill:#cdd6f4;font-size:11px;text-anchor:middle;dominant-baseline:central}
</style>
</head><body>
<div class="controls"><button id="play-pause" data-testid="play-pause">Play</button><button id="replay">Replay</button>
<span id="kf-label">0/<span id="kf-total">0</span></span></div>
<div id="vis"><svg width="680" height="380"><g id="stages"></g></svg></div>
<div class="log" id="log"></div>
<script>
(function(){
const kf=[{time:0,label:'idle'},{time:600,label:'detect-os'},{time:1800,label:'detect-pm'},{time:2800,label:'install-git'},{time:4200,label:'install-nvm'},{time:5800,label:'install-node'},{time:7000,label:'output-json'},{time:8000,label:'done'}];
const vf=[{label:'idle',hor:0,ver:0,precision:0,logCount:0},{label:'detect-os',hor:1,ver:0,precision:0,logCount:1},{label:'detect-pm',hor:2,ver:0,precision:0,logCount:2},{label:'install-git',hor:2,ver:1,precision:0,logCount:3},{label:'install-nvm',hor:3,ver:1,precision:1,logCount:4},{label:'install-node',hor:3,ver:2,precision:2,logCount:5},{label:'output-json',hor:4,ver:2,precision:2,logCount:6},{label:'done',hor:5,ver:3,precision:3,logCount:7}];
const T=8000;window.ANIMATION_DURATION_MS=T;window.ANIMATION_KEYFRAMES=kf;window.ANIMATION_VERIFICATION=vf;
let ck=0,pl=false,tm=null;
const sv=d3.select('#vis svg'),lg=document.getElementById('log'),pb=document.getElementById('play-pause'),rb=document.getElementById('replay'),kl=document.getElementById('kf-label'),kt=document.getElementById('kf-total');
kt.textContent=kf.length-1;
const st=[{l:'PROCESSOR_ARCHITECTURE: AMD64'},{l:'winget found'},{l:'winget install Git.Git'},{l:'winget install CoreyButler.NVMforWindows'},{l:'nvm install lts'},{l:'ConvertTo-Json to stdout'},{l:'done'}];
function ul(c){lg.innerHTML='';const e=['env-check.ps1: waiting...','env-check.ps1: detected win32 x64','env-check.ps1: pkg_manager = winget','env-check.ps1: installing Git via winget','env-check.ps1: installing nvm-windows','env-check.ps1: Node.js LTS ready','env-check.ps1: JSON output','env-check.ps1: done'];for(let i=0;i<=Math.min(c,e.length-1);i++){const d=document.createElement('div');d.textContent=e[i];lg.appendChild(d)}}
function rs(i){ck=i;kl.textContent=i+'/'+(kf.length-1);const g=sv.select('#stages');g.selectAll('*').remove();const sh=Math.min(i,st.length);for(let j=0;j<sh;j++){const y=35+j*40;g.append('rect').attr('class','box').attr('x',30).attr('y',y).attr('width',380).attr('height',30).attr('stroke',j===sh-1&&i<st.length?'#f9e2af':'#585b70');g.append('text').attr('class','lbl').attr('x',220).attr('y',y+17).text(st[j].l);g.append('circle').attr('cx',430).attr('cy',y+15).attr('r',5).attr('fill',j<4?'#f9e2af':j<6?'#89b4fa':'#a6e3a1')}ul(i)}
function jk(idx){if(idx<0||idx>=kf.length)return;pl=false;pb.textContent='Play';if(tm){clearInterval(tm);tm=null}rs(idx)}
window.jumpToKeyframe=jk;
function ra(){jk(0)}window.resetAnimation=ra;
function gas(){const v=vf[ck]||vf[0];return{hor:v.hor,ver:v.ver,precision:v.precision,boundsOpacity:0,logCount:v.logCount,keyframeIdx:ck,keyframeLabel:kf[ck].label}}
window.getAnimationState=gas;
rs(0);
pb.addEventListener('click',function(){if(pl){pl=false;pb.textContent='Play';if(tm){clearInterval(tm);tm=null}}else{pl=true;pb.textContent='Pause';if(ck>=kf.length-1)ck=0;const stp=T/(kf.length-1);tm=setInterval(()=>{if(ck<kf.length-1)jk(ck+1);else{pl=false;pb.textContent='Play';clearInterval(tm);tm=null}},stp)}});
rb.addEventListener('click',function(){ra();pl=true;pb.textContent='Pause';const stp=T/(kf.length-1);tm=setInterval(()=>{if(ck<kf.length-1)jk(ck+1);else{pl=false;pb.textContent='Play';clearInterval(tm);tm=null}},stp)});
})();
</script>
</body></html>
```

## 6. Testing Requirements

| Test ID | Scenario | Steps | Expected |
|---------|----------|-------|----------|
| EP01 | Run on Windows | `powershell -File env-check.ps1` | JSON with os=win32 |
| EP02 | Git already installed | Run with Git in PATH | No install attempted |
| EP03 | Output matches Unix schema | Compare JSON keys with .sh variant | Same key set |
| EP04 | nvm-windows already installed | Run with nvm in PATH | No install attempted |

## 7. Cross-References

| Direction | Spec File | Relationship |
|-----------|-----------|--------------|
| Twin (Unix) | `.opencode/skills/opensassi/scripts/env-check.sh.spec.md` | Same JSON schema, Unix native |
| Consumed by | `.opencode/skills/opensassi/scripts/install-npm-deps.spec.md` | Ensures node is available before npm install |
