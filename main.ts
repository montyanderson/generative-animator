import { parse } from "https://deno.land/std@0.199.0/flags/mod.ts";
import { Buffer } from "https://deno.land/std@0.199.0/io/mod.ts";
import { encode } from "https://deno.land/std@0.199.0/encoding/base64.ts";
import { copy, writerFromStreamWriter } from "https://deno.land/std@0.199.0/streams/mod.ts";
import { assert } from "https://deno.land/std@0.199.0/assert/mod.ts";
import { createProdia } from "npm:prodia@0.1.1";

// parse cli arguments

const {
	"api-key": apiKey,
	"input": input,
	"prompt": prompt,
	"negative-prompt": negativePrompt,
	"speed": speed,
	"fps": fps,
	"duration": duration,
	"output": output,
} = parse(Deno.args);

assert(typeof apiKey === "string", "--api-key must be a string");
assert(typeof input === "string", "--input must be a string");
assert(typeof prompt === "string", "--prompt must be a string");
assert(typeof negativePrompt === "string", "--negative-prompt must be a string");
assert(typeof speed === "number", "--speed must be a number");
assert(typeof fps === "number", "--fps must be a number");
assert(typeof duration === "number", "--duration must be a number");
assert(typeof output === "string", "--output must be a string");

// start the video encoder

const ffmpeg = new Deno.Command("ffmpeg", {
	args: [
		"-framerate",
		`${speed}`,
		"-f",
		"image2pipe",
		"-i",
		"-",
		"-vf",
		`minterpolate=${fps}:blend`,
		output,
	],
	stdin: "piped",
});

const encoder = ffmpeg.spawn();

// initialise prodia and load the input image

const prodia = createProdia({ apiKey });

const imageData = encode(await Deno.readFile(input));

// run the generations

let i = 0, writeQueue = Promise.resolve();

const createThread = async () => {
	while (i++ < duration * speed) {
		const job = await prodia.controlnet({
			// @ts-ignore
			imageData,
			cfgScale: 9,
			prompt,
			negative_prompt: negativePrompt,
			controlnet_model: "control_v11p_sd15_canny [d14c016b]",
			controlnet_module: "canny",
			sampler: "DDIM",
			width: 1024,
			height: 1024,
			seed: i,
		});

		const completedJob = await prodia.wait(job);

		if ("imageUrl" in completedJob) {
			writeQueue = writeQueue.then(async () => {
				const response = await fetch(completedJob.imageUrl);
				const reader = new Buffer(await response.arrayBuffer());

				const writer = encoder.stdin.getWriter();

				await copy(reader, writerFromStreamWriter(writer));
				writer.releaseLock();
			});
		}
	}
};

// run 10 generations concurrently
await Promise.all(Array(10).fill(undefined).map(createThread));
await writeQueue;
await encoder.stdin.close();
