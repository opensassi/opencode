# wsl2 install.ps1 spec

## 1. Overview

**Role**: Sets up WSL2 on Windows for opencode. Enables WSL + VMP features, installs WSL2 kernel, sets WSL2 as default, installs Ubuntu, clones the repo inside WSL, runs Ubuntu install.sh inside WSL.

**Language**: PowerShell, requires admin

**Lifecycle**: Check WSL feature, enable if missing, update kernel, set WSL2 default, install Ubuntu, setup repo inside WSL, run Ubuntu install.sh inside WSL

**Cross-references**: Called by scripts/install.ps1 when WSL missing. Dispatches to ubuntu-noble-24.04/install.sh inside WSL.

## 2. Component Specifications

```
Usage: powershell -ExecutionPolicy Bypass -File scripts\install\windows\wsl2\install.ps1
```

## 3. System Architecture

```mermaid
graph TB
    subgraph Win[Windows Phase]
        Enable[Enable WSL + VMP]
        Reboot[System reboot]
        Kernel[Update WSL2 kernel]
        Default[Set WSL2 as default]
        Ubuntu[wsl --install -d Ubuntu]
    end
    subgraph WSL[WSL Phase]
        Repo[Clone or copy repo]
        Run[Run Ubuntu install.sh]
    end
    Enable --> Reboot --> Kernel --> Default --> Ubuntu --> Repo --> Run
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant PS as install.ps1
    participant WSL as wsl.exe
    participant Linux as Ubuntu WSL
    participant Git as GitHub

    PS->>PS: Get-WindowsOptionalFeature WSL + VMP
    alt features disabled
        PS->>PS: Enable-WindowsOptionalFeature
        PS->>PS: reboot required
    end
    PS->>WSL: wsl --update
    PS->>WSL: wsl --set-default-version 2
    PS->>WSL: wsl --install -d Ubuntu
    PS->>WSL: wsl -d Ubuntu ls
    alt repo not in WSL
        PS->>Git: git clone origin
        Git->>WSL: cloned to ~/repo
    end
    PS->>Linux: wsl -d Ubuntu bash install.sh
    Linux->>PS: toolchain installed
```

## 5. Visualization

### Animation Source

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><title>WSL2 Installer</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>body{font-family:monospace;background:#1e1e2e;color:#cdd6f4;margin:0;padding:20px}
.controls{margin-bottom:15px}.controls button{background:#45475a;color:#cdd6f4;border:1px solid #585b70;padding:6px 16px;cursor:pointer}
.controls span{margin:0 12px;font-size:13px;color:#a6adc8}
#vis{width:680px;height:340px;border:1px solid #45475a;background:#181825;overflow:hidden}
.log{margin-top:10px;max-height:80px;overflow-y:auto;font-size:11px;color:#a6adc8}
</style>
</head><body>
<div class="controls"><button id="play-pause" data-testid="play-pause">Play</button><button id="replay">Replay</button><span id="kf-label">0/<span id="kf-total">0</span></span></div>
<div id="vis"><svg width="680" height="340"><g id="s"></g></svg></div><div class="log" id="log"></div>
<script>
(function(){const kf=[{time:0,label:'idle'},{time:700,label:'enable-wsl'},{time:2200,label:'install-ubuntu'},{time:3800,label:'setup-repo'},{time:5200,label:'run-installer'},{time:6500,label:'done'}];const vf=[{label:'idle',hor:0,ver:0,precision:0,logCount:0},{label:'enable-wsl',hor:1,ver:0,precision:0,logCount:1},{label:'install-ubuntu',hor:2,ver:1,precision:0,logCount:2},{label:'setup-repo',hor:3,ver:1,precision:1,logCount:3},{label:'run-installer',hor:3,ver:2,precision:2,logCount:4},{label:'done',hor:4,ver:3,precision:3,logCount:5}];const T=6500;window.ANIMATION_DURATION_MS=T;window.ANIMATION_KEYFRAMES=kf;window.ANIMATION_VERIFICATION=vf;let ck=0,pl=false,tm=null;const sv=d3.select('#vis svg'),lg=document.getElementById('log'),pb=document.getElementById('play-pause'),rb=document.getElementById('replay'),kl=document.getElementById('kf-label'),kt=document.getElementById('kf-total');kt.textContent=kf.length-1;function jk(idx){if(idx<0||idx>=kf.length)return;pl=false;pb.textContent='Play';if(tm){clearInterval(tm);tm=null}ck=idx;kl.textContent=idx+'/'+(kf.length-1);const g=sv.select('#s');g.selectAll('*').remove();const ee=['WSL2 installer: waiting','WSL2 installer: enabling WSL features','WSL2 installer: installing Ubuntu','WSL2 installer: setting up repo inside WSL','WSL2 installer: running Ubuntu install.sh','WSL2 installer: done'];for(let i=0;i<=Math.min(idx,5);i++){const d=document.createElement('div');d.textContent=ee[i];lg.appendChild(d)}if(idx>0){for(let j=0;j<Math.min(idx,5);j++){const y=35+j*50;g.append('rect').attr('x',30).attr('y',y).attr('width',400).attr('height',34).attr('fill','#313244').attr('stroke',j===Math.min(idx,5)-1?'#f9e2af':'#585b70').attr('rx',4);g.append('text').attr('x',230).attr('y',y+20).attr('fill','#cdd6f4').attr('font-size','11').attr('text-anchor','middle').text(ee[idx].replace('WSL2 installer: ',''))}}}window.jumpToKeyframe=jk;window.resetAnimation=function(){jk(0)};window.getAnimationState=function(){const v=vf[ck]||vf[0];return{hor:v.hor,ver:v.ver,precision:v.precision,boundsOpacity:0,logCount:v.logCount,keyframeIdx:ck,keyframeLabel:kf[ck].label}};jk(0);pb.addEventListener('click',function(){if(pl){pl=false;pb.textContent='Play';if(tm){clearInterval(tm);tm=null}}else{pl=true;pb.textContent='Pause';if(ck>=kf.length-1)ck=0;const stp=T/(kf.length-1);tm=setInterval(()=>{if(ck<kf.length-1)jk(ck+1);else{pl=false;pb.textContent='Play';clearInterval(tm);tm=null}},stp)}});rb.addEventListener('click',function(){jk(0);pl=true;pb.textContent='Pause';const stp=T/(kf.length-1);tm=setInterval(()=>{if(ck<kf.length-1)jk(ck+1);else{pl=false;pb.textContent='Play';clearInterval(tm);tm=null}},stp)});})();
</script>
</body></html>
```

## 6. Testing Requirements

| Test ID | Scenario | Expected |
|---------|----------|----------|
| WW01 | First run, WSL disabled | Enables features, prompts reboot |
| WW02 | Second run, WSL enabled, no Ubuntu | Installs Ubuntu, prompts for username |
| WW03 | Third run, WSL + Ubuntu ready | Sets up repo, runs Ubuntu installer inside WSL |
