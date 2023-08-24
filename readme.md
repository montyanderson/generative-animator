# generative-animator

Create AI videos using Prodia's Stable Diffusion ControlNet API.

| Input                       | Output                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ![Input Image](./input.png) | <video src="https://github.com/montyanderson/generative-animator/assets/3048503/52608e1f-9308-42b1-98b5-03f139360b2d"> |

## example

1. Get a [Prodia API Key](https://docs.prodia.com/reference/getting-started-guide).

2. Run the CLI.

To generate a 10 seconds long video, using 5 generations a second, interpolated to 60 fps:

```
deno run --allow-all main.ts \
    --api-key $PRODIA_API_KEY \
    --input input.png \
    --prompt "purple logo, hyper-real, vibrant, lightening" \
    --negative-prompt "badly drawn" \
    --speed 10 \
    --fps 60 \
    --duration 5 \
    --output output.mp4
```
