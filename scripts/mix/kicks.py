"""Tracks kick attacks (70-200 Hz punch) beat by beat from a first-kick guess, then least-squares fits time = t0 + k*period."""
import subprocess, sys, numpy as np
SR=44100
def load(p, a, b):
    raw=subprocess.run(["ffmpeg","-v","error","-i",p,"-af",f"atrim=start={a}:end={b}","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
def track(path, guess, bpm, nbeats=64, origin=0.0):
    a=guess-1.0; x=load(path,a,guess+nbeats*60/bpm+1.0) if path else None
    F=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); F[(f<70)|(f>200)]=0
    y=np.fft.irfft(F,len(x)); k=int(0.001*SR); env=np.sqrt(np.convolve(y*y,np.ones(k)/k,mode="same"))
    d=np.diff(env); beat=60/bpm; times=[]; t=guess
    for i in range(nbeats):
        lo=int((t-a-0.035)*SR); hi=int((t-a+0.035)*SR); j=np.argmax(d[lo:hi])+lo
        times.append(a+j/SR); t=times[-1]+beat
    times=np.array(times); k=np.arange(nbeats)
    period,t0=np.polyfit(k,times,1); res=(times-(t0+k*period))*1000
    return t0, 60/period, res
for label,path,guess,bpm in [("Virus",sys.argv[1],97.757+0.285,128.0),("Voodoo",sys.argv[2],53.741-0.180,130.0)]:
    t0,fit_bpm,res=track(path,guess,bpm)
    print(f"{label}: first kick {t0:.4f} s, fitted {fit_bpm:.3f} BPM, residuals: median |{np.median(np.abs(res)):.1f}| ms, max |{np.abs(res).max():.1f}| ms, outliers>8ms: {(np.abs(res)>8).sum()}/64")
