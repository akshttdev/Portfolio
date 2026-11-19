import sys, numpy as np, subprocess
sys.path.insert(0, ".")
SR=44100
def load(p):
    raw=subprocess.run(["ffmpeg","-v","error","-i",p,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
def track(x, guess, bpm, nbeats=62):
    F=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); F[(f<70)|(f>200)]=0
    y=np.fft.irfft(F,len(x)); k=int(0.001*SR); env=np.sqrt(np.convolve(y*y,np.ones(k)/k,mode="same")); d=np.diff(env)
    beat=60/bpm; t=guess; times=[]
    for i in range(nbeats):
        lo=max(0,int((t-0.035)*SR)); hi=int((t+0.035)*SR); j=np.argmax(d[lo:hi])+lo; times.append(j/SR); t=times[-1]+beat
    k=np.arange(nbeats); times=np.array(times); period,t0=np.polyfit(k,times,1); res=(times-(t0+k*period))*1000
    return t0*1000, 60/period, np.median(np.abs(res))
r={}
for name in ["virus","voodoo"]:
    x=load(f"out/{name}.mp3"); t0,bpm,med=track(x,0.010,128.0); r[name]=t0
    print(f"{name:7s}: decoded {len(x)} samples ({len(x)/SR:.4f} s), first kick at {t0:6.2f} ms, {bpm:.3f} BPM, median residual {med:.1f} ms")
print(f"deck 2 vs deck 1 kick offset: {r['voodoo']-r['virus']:+.2f} ms")
