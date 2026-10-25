<script lang="ts">
	/**
	 * Animated film grain laid over whatever sits below it. The noise is an SVG
	 * feTurbulence texture; it is rendered once and jittered with a stepped CSS
	 * transform, so it costs no per-frame JavaScript.
	 */
	const id = `grain-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="grain" aria-hidden="true">
	<svg xmlns="http://www.w3.org/2000/svg">
		<filter {id} x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" />
			<feColorMatrix type="saturate" values="0" />
			<!-- Raw turbulence hovers around mid-grey, which `overlay` leaves untouched; stretch it. -->
			<feComponentTransfer>
				<feFuncR type="linear" slope="3" intercept="-1" />
				<feFuncG type="linear" slope="3" intercept="-1" />
				<feFuncB type="linear" slope="3" intercept="-1" />
				<feFuncA type="linear" slope="0" intercept="1" />
			</feComponentTransfer>
		</filter>
		<rect width="100%" height="100%" filter="url(#{id})" />
	</svg>
</div>

<style>
	.grain {
		position: absolute;
		inset: -50%;
		z-index: var(--z-grain);
		pointer-events: none;
		opacity: var(--grain-opacity);
		mix-blend-mode: var(--grain-blend);
		animation: jitter var(--grain-speed) steps(1) infinite;
	}

	/* --grain-size > 1 renders the noise smaller and scales it up into coarser grains. */
	svg {
		display: block;
		width: calc(100% / var(--grain-size));
		height: calc(100% / var(--grain-size));
		transform: scale(var(--grain-size));
		transform-origin: 0 0;
	}

	@keyframes jitter {
		0% {
			transform: translate(0, 0);
		}
		20% {
			transform: translate(-7%, 4%);
		}
		40% {
			transform: translate(5%, -9%);
		}
		60% {
			transform: translate(-3%, 8%);
		}
		80% {
			transform: translate(9%, -2%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.grain {
			animation: none;
		}
	}
</style>
