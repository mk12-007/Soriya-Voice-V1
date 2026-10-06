/**
 * Generates a valid RIFF WAV buffer from raw linear PCM 16-bit audio data.
 * @param pcmData Buffer containing raw 16-bit linear PCM samples
 * @param sampleRate Sample rate in Hz (e.g. 24000 for Gemini TTS, 16000 or 44100)
 * @param numChannels Number of audio channels (1 for mono, 2 for stereo)
 */
export function pcmToWavBuffer(
  pcmData: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const subChunk2Size = pcmData.length;
  const chunkSize = 36 + subChunk2Size;

  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0); // ChunkID
  header.writeUInt32LE(chunkSize, 4); // ChunkSize
  header.write('WAVE', 8); // Format

  // fmt sub-chunk
  header.write('fmt ', 12); // Subchunk1ID
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // data sub-chunk
  header.write('data', 36); // Subchunk2ID
  header.writeUInt32LE(subChunk2Size, 40); // Subchunk2Size

  return Buffer.concat([header, pcmData]);
}

/**
 * Creates a synthetic demo acoustic tone sequence (harmonic speech-like envelope) for demo audio
 */
export function createSyntheticDemoWav(text: string, sampleRate = 24000): Buffer {
  // Approximate duration based on character count: ~10 chars/sec, min 1.5s, max 6s
  const durationSeconds = Math.min(6, Math.max(1.5, text.length * 0.08));
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const pcm = Buffer.alloc(totalSamples * 2);

  // Generate melodic speech harmonic simulation (fundamental pitch ~180Hz + formant frequencies)
  const f0 = 185; // Khmer pitch fundamental
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Syllable rhythm envelope modulation (~3.5 syllables per sec)
    const envelope = Math.sin(2 * Math.PI * 3.5 * t);
    const amp = Math.max(0, envelope) * 0.45 + 0.1;
    
    // Fade in and fade out edges
    let edgeFade = 1.0;
    if (t < 0.1) edgeFade = t / 0.1;
    if (t > durationSeconds - 0.2) edgeFade = Math.max(0, (durationSeconds - t) / 0.2);

    const s1 = Math.sin(2 * Math.PI * f0 * t);
    const s2 = 0.5 * Math.sin(2 * Math.PI * (f0 * 2) * t);
    const s3 = 0.25 * Math.sin(2 * Math.PI * (f0 * 3) * t);
    const val = (s1 + s2 + s3) * amp * edgeFade * 0.5;

    const sample16 = Math.max(-32768, Math.min(32767, Math.floor(val * 32767)));
    pcm.writeInt16LE(sample16, i * 2);
  }

  return pcmToWavBuffer(pcm, sampleRate, 1, 16);
}
