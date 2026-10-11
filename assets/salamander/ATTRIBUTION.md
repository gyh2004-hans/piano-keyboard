# Salamander Grand Piano v3

Original recordings: **Alexander Holm**. Piano: Yamaha C5.
SFZ reconstruction: **kinwie**. Retuning: **Markus Fiedler**.

Source: https://github.com/sfzinstruments/SalamanderGrandPiano
Pinned revision: `3382bf9496bba2486f5ab0de55a264d1dfc38404`.
License: **Creative Commons Attribution 3.0 Unported (CC BY 3.0)**.
License URL: https://creativecommons.org/licenses/by/3.0/
Full license: `upstream/LICENSE` in the Skill or `LICENSE-Salamander.txt` in exported apps.

All 641 original FLAC samples are retained byte-for-byte, 48 kHz, 24-bit stereo.
No lossy conversion, normalization, tail trimming or reduction of velocity layers is performed.
Generated JavaScript wrappers contain the original FLAC bytes in Base64; packaging changes only.
The Web Audio player is an independent adaptation of the note/velocity mapping and retuning,
not a complete SFZ/ARIA engine. The auxiliary resonance, hammer-release and pedal samples
are preserved for subsequent use, but these special effects are not rendered by this player.
No endorsement by the original authors is implied.

Skill code remains MIT; this audio library is CC BY 3.0 and is not relicensed as MIT.
Keep this attribution and the audio license in every distributed application.
