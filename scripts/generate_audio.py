import math
import random
import struct
import subprocess
import wave
import os

SAMPLE_RATE = 44100
DURATION = 45.0  # 45 seconds seamless loop
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)
OUT_DIR = "public/audio"
os.makedirs(OUT_DIR, exist_ok=True)

def clamp(val, min_val=-1.0, max_val=1.0):
    return max(min_val, min(max_val, val))

def apply_crossfade(samples_left, samples_right, fade_samples=SAMPLE_RATE * 2):
    # Crossfade the end of the loop with the beginning to guarantee 100% seamless looping
    n = len(samples_left)
    fade_len = min(fade_samples, n // 4)
    out_left = list(samples_left)
    out_right = list(samples_right)
    
    for i in range(fade_len):
        t = i / float(fade_len)
        # equal power crossfade
        w_in = math.sin(t * math.pi * 0.5)
        w_out = math.cos(t * math.pi * 0.5)
        
        # blend tail into head
        tail_idx = n - fade_len + i
        head_val_l = samples_left[i]
        tail_val_l = samples_left[tail_idx]
        head_val_r = samples_right[i]
        tail_val_r = samples_right[tail_idx]
        
        blended_l = head_val_l * w_in + tail_val_l * w_out
        blended_r = head_val_r * w_in + tail_val_r * w_out
        
        out_left[i] = blended_l
        out_right[i] = blended_r
        out_left[tail_idx] = blended_l
        out_right[tail_idx] = blended_r
        
    return out_left, out_right

def save_wav_and_mp3(name, left, right):
    left, right = apply_crossfade(left, right)
    wav_path = os.path.join(OUT_DIR, f"{name}.wav")
    mp3_path = os.path.join(OUT_DIR, f"{name}.mp3")
    
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        
        # Find peak for normalization
        peak = max(max(abs(l) for l in left), max(abs(r) for r in right), 0.0001)
        target_peak = 0.88
        gain = target_peak / peak
        
        frames = bytearray()
        for l, r in zip(left, right):
            sl = int(clamp(l * gain) * 32767)
            sr = int(clamp(r * gain) * 32767)
            frames.extend(struct.pack("<hh", sl, sr))
            
        wf.writeframes(frames)
    
    # Convert to MP3 using ffmpeg with 192k bitrate
    cmd = [
        "ffmpeg", "-y", "-i", wav_path,
        "-codec:a", "libmp3lame", "-b:a", "192k",
        mp3_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Remove temporary WAV to keep package light
    if os.path.exists(wav_path):
        os.remove(wav_path)
    print(f"Generated {mp3_path} ({os.path.getsize(mp3_path)} bytes)")

# 1. 10Hz Alpha Waves (Binaural Beats: 216Hz Left, 226Hz Right + warm meditative drone)
def gen_alpha_waves():
    print("Generating 10Hz Alpha Waves...")
    left = [0.0] * NUM_SAMPLES
    right = [0.0] * NUM_SAMPLES
    
    f_carrier = 216.0
    f_beat = 10.0
    f_left = f_carrier
    f_right = f_carrier + f_beat
    
    # Sub harmonic 108Hz and 54Hz for warmth
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        
        # Primary binaural sine tones
        binaural_l = math.sin(2.0 * math.pi * f_left * t) * 0.45
        binaural_r = math.sin(2.0 * math.pi * f_right * t) * 0.45
        
        # Warm ambient drone bed (warm harmonic padding)
        drone1 = math.sin(2.0 * math.pi * 108.0 * t) * 0.22
        drone2 = math.sin(2.0 * math.pi * 54.0 * t) * 0.18
        drone3 = math.sin(2.0 * math.pi * 324.0 * t + 0.3) * 0.08
        
        # Subtle gentle slow movement (0.05Hz LFO)
        lfo = 1.0 + 0.08 * math.sin(2.0 * math.pi * 0.05 * t)
        
        # Soft pink noise floor
        noise = (random.random() * 2.0 - 1.0) * 0.03
        
        left[i] = (binaural_l + drone1 * 0.95 + drone2 + drone3 * 0.9 + noise) * lfo
        right[i] = (binaural_r + drone1 * 1.05 + drone2 + drone3 * 1.1 + noise) * lfo
        
    save_wav_and_mp3("alpha_waves", left, right)

# 2. Pink Noise (Balanced cognitive masking sound, equal energy per octave)
def gen_pink_noise():
    print("Generating Pink Noise...")
    left = [0.0] * NUM_SAMPLES
    right = [0.0] * NUM_SAMPLES
    
    # Voss-McCartney algorithm for left and right channels independently
    def make_pink_filter():
        b = [0.0] * 7
        def filter_sample(white):
            b[0] = 0.99886 * b[0] + white * 0.0555179
            b[1] = 0.99332 * b[1] + white * 0.0750759
            b[2] = 0.96900 * b[2] + white * 0.1538520
            b[3] = 0.86650 * b[3] + white * 0.3104856
            b[4] = 0.55000 * b[4] + white * 0.5329522
            b[5] = -0.7616 * b[5] - white * 0.0168980
            pink = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362) * 0.11
            b[6] = white * 0.115926
            return pink
        return filter_sample

    pink_l = make_pink_filter()
    pink_r = make_pink_filter()
    
    for i in range(NUM_SAMPLES):
        w_l = random.random() * 2.0 - 1.0
        w_r = random.random() * 2.0 - 1.0
        left[i] = pink_l(w_l)
        right[i] = pink_r(w_r)
        
    # Gentle lowpass smoothing
    alpha = 0.15
    for i in range(1, NUM_SAMPLES):
        left[i] = left[i - 1] + alpha * (left[i] - left[i - 1])
        right[i] = right[i - 1] + alpha * (right[i] - right[i - 1])
        
    save_wav_and_mp3("pink_noise", left, right)

# 3. Deep Brown Noise (Low-frequency rumble for deep flow)
def gen_brown_noise():
    print("Generating Deep Brown Noise...")
    left = [0.0] * NUM_SAMPLES
    right = [0.0] * NUM_SAMPLES
    
    val_l = 0.0
    val_r = 0.0
    
    for i in range(NUM_SAMPLES):
        wl = random.random() * 2.0 - 1.0
        wr = random.random() * 2.0 - 1.0
        
        # Leaky integrator (Brownian / red noise)
        val_l = (val_l + (0.025 * wl)) / 1.02
        val_r = (val_r + (0.025 * wr)) / 1.02
        
        # Add deep sub rumble (42Hz & 55Hz)
        t = i / SAMPLE_RATE
        sub = math.sin(2.0 * math.pi * 42.0 * t) * 0.04 + math.sin(2.0 * math.pi * 55.0 * t) * 0.03
        
        left[i] = val_l * 3.2 + sub
        right[i] = val_r * 3.2 + sub
        
    # High-pass at ~20Hz to eliminate DC offset, lowpass at 600Hz
    # Simple 2-pole lowpass
    lp_l = 0.0
    lp_r = 0.0
    for i in range(NUM_SAMPLES):
        lp_l += 0.08 * (left[i] - lp_l)
        lp_r += 0.08 * (right[i] - lp_r)
        left[i] = lp_l
        right[i] = lp_r

    save_wav_and_mp3("brown_noise", left, right)

# 4. Zen Meditation (Harmonic Tibetan resonance)
def gen_zen_meditation():
    print("Generating Zen Meditation...")
    left = [0.0] * NUM_SAMPLES
    right = [0.0] * NUM_SAMPLES
    
    # Tibetan singing bowl harmonic frequencies
    # Fundamental: 108Hz (sacred frequency), harmonics: 216Hz, 324Hz, 432Hz, 540Hz, 864Hz
    harmonics = [
        (108.0, 0.40, 0.0),
        (216.0, 0.28, 0.4),
        (324.0, 0.18, 0.8),
        (432.0, 0.12, 1.2),
        (540.0, 0.08, 1.6),
        (864.0, 0.05, 2.0),
        (1080.0, 0.03, 2.4),
    ]
    
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        # Slow meditative breathing cycle (0.08Hz = ~12 sec breath)
        breath = 1.0 + 0.12 * math.sin(2.0 * math.pi * 0.08 * t)
        
        s_left = 0.0
        s_right = 0.0
        
        for freq, amp, phase in harmonics:
            # Gentle frequency shimmer (chorus / Tibetan metal resonance)
            detune_l = math.sin(2.0 * math.pi * 0.18 * t + phase) * 0.4
            detune_r = math.cos(2.0 * math.pi * 0.22 * t + phase) * 0.4
            
            s_left += amp * math.sin(2.0 * math.pi * (freq + detune_l) * t + phase)
            s_right += amp * math.sin(2.0 * math.pi * (freq + detune_r) * t + phase + 0.2)
            
        # Subtle gentle bell chime resonance decaying throughout
        # Event 1 at t=0, Event 2 at t=22.5s
        for t_hit in [0.0, 22.5]:
            dt = t - t_hit
            if dt >= 0:
                bell_decay = math.exp(-dt * 0.35)
                bell = math.sin(2.0 * math.pi * 864.0 * dt) * 0.15 * bell_decay
                s_left += bell
                s_right += bell * 0.85
                
        left[i] = s_left * breath
        right[i] = s_right * breath
        
    save_wav_and_mp3("zen_meditation", left, right)

# 5. Ambient Rainfall (Gentle atmospheric rainfall)
def gen_ambient_rainfall():
    print("Generating Ambient Rainfall...")
    left = [0.0] * NUM_SAMPLES
    right = [0.0] * NUM_SAMPLES
    
    # Layer 1: continuous rain hiss/wash (filtered noise)
    b_l = [0.0] * 3
    b_r = [0.0] * 3
    
    # Pre-generate droplet events
    num_droplets = int(DURATION * 60) # ~60 drops per second
    droplets = []
    for _ in range(num_droplets):
        drop_time = random.uniform(0, DURATION)
        drop_freq = random.uniform(1400, 3200)
        drop_pan = random.uniform(0.1, 0.9)
        drop_amp = random.uniform(0.04, 0.12)
        droplets.append((drop_time, drop_freq, drop_pan, drop_amp))
        
    # Sort droplets by time
    droplets.sort(key=lambda d: d[0])
    drop_idx = 0
    active_drops = []
    
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        
        # Wind / intensity swell (0.04Hz)
        swell = 0.85 + 0.25 * math.sin(2.0 * math.pi * 0.04 * t)
        
        # Base rain noise
        w_l = random.random() * 2.0 - 1.0
        w_r = random.random() * 2.0 - 1.0
        
        b_l[0] = 0.82 * b_l[0] + w_l * 0.18
        b_l[1] = 0.70 * b_l[1] + b_l[0] * 0.30
        
        b_r[0] = 0.82 * b_r[0] + w_r * 0.18
        b_r[1] = 0.70 * b_r[1] + b_r[0] * 0.30
        
        rain_l = b_l[1] * swell * 0.7
        rain_r = b_r[1] * swell * 0.7
        
        # Check new droplets
        while drop_idx < len(droplets) and droplets[drop_idx][0] <= t:
            active_drops.append((droplets[drop_idx], 0))  # (data, sample_offset)
            drop_idx += 1
            
        # Accumulate active droplets
        drop_sound_l = 0.0
        drop_sound_r = 0.0
        next_active = []
        
        for data, offset in active_drops:
            _, freq, pan, amp = data
            dt_drop = offset / SAMPLE_RATE
            if dt_drop < 0.06: # 60ms drop ping
                env = math.exp(-dt_drop * 75.0)
                sine = math.sin(2.0 * math.pi * freq * dt_drop) * env * amp
                drop_sound_l += sine * (1.0 - pan)
                drop_sound_r += sine * pan
                next_active.append((data, offset + 1))
        active_drops = next_active
        
        left[i] = rain_l + drop_sound_l
        right[i] = rain_r + drop_sound_r
        
    save_wav_and_mp3("ambient_rainfall", left, right)

if __name__ == "__main__":
    gen_alpha_waves()
    gen_pink_noise()
    gen_brown_noise()
    gen_zen_meditation()
    gen_ambient_rainfall()
    print("All 5 audio tracks generated successfully!")
