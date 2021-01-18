import { ImageLoader } from 'next/image';
import { useMemo } from 'react';
import imageUrlBuilder from '@sanity/image-url';
import {
	SanityAsset,
	SanityClient,
	SanityImageSource,
	SanityImageObject,
	SanityReference
} from '@sanity/image-url/lib/types/types';
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
export type { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';

export type NextSanityImageProps = {
	loader: ImageLoader;
	src: string;
	width: number;
	height: number;
	layout: 'responsive';
};

export type NextSanityImageBuilderOptions = {
	width: number;
	originalAspectRatio: number;
};

type ImageConfig = {
	deviceSizes: number[];
	imageSizes: number[];
};

// From https://github.com/vercel/next.js/blob/canary/packages/next/next-server/server/image-config.ts
const imageConfigDefault: ImageConfig = {
	deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
	imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
};

const { deviceSizes, imageSizes } =
	((process.env.__NEXT_IMAGE_OPTS as any) as ImageConfig) || imageConfigDefault;

const allSizes = [...deviceSizes, ...imageSizes];
allSizes.sort((a, b) => a - b);

const DEFAULT_IMAGE_URL_BUILDER = (
	imageUrlBuilder: ImageUrlBuilder,
	options: NextSanityImageBuilderOptions
) => {
	return imageUrlBuilder.width(options.width).fit('clip');
};

function getSanityRefId(image: SanityImageSource): string {
	if (typeof image === 'string') {
		return image;
	}

	const obj = image as SanityImageObject;
	const ref = image as SanityReference;
	const img = image as SanityAsset;

	if (typeof image === 'string') {
		return image;
	}

	if (obj.asset) {
		return obj.asset._ref || (obj.asset as SanityAsset)._id;
	}

	return ref._ref || img._id || '';
}

export function useNextSanityImage(
	sanityClient: SanityClient,
	image: SanityImageSource,
	imageBuilder: (
		imageUrlBuilder: ImageUrlBuilder,
		options: NextSanityImageBuilderOptions
	) => ImageUrlBuilder = DEFAULT_IMAGE_URL_BUILDER
): NextSanityImageProps {
	return useMemo<NextSanityImageProps>(() => {
		const id = getSanityRefId(image);
		const dimensions = id.split('-')[2];

		const [baseImgWidth, baseImgHeight] = dimensions
			.split('x')
			.map((num: string) => parseInt(num, 10));
		const originalAspectRatio = baseImgWidth / baseImgHeight;

		const loader: ImageLoader = ({ width }) => {
			return (
				imageBuilder(imageUrlBuilder(sanityClient).image(image), {
					width,
					originalAspectRatio
				}).url() || ''
			);
		};

		const highestConfiguredImageSize = allSizes[allSizes.length - 1];
		const baseImgBuilder = imageBuilder(imageUrlBuilder(sanityClient).image(image), {
			width: highestConfiguredImageSize,
			originalAspectRatio
		});

		const width =
			baseImgBuilder.options.width ||
			(baseImgBuilder.options.maxWidth
				? Math.min(baseImgBuilder.options.maxWidth, baseImgWidth)
				: baseImgWidth);

		const height =
			baseImgBuilder.options.height ||
			(baseImgBuilder.options.maxHeight
				? Math.min(baseImgBuilder.options.maxHeight, baseImgHeight)
				: Math.round(width / originalAspectRatio));

		return {
			loader,
			src: baseImgBuilder.url() || '',
			width,
			height,
			layout: 'responsive'
		};
	}, [imageBuilder, image, sanityClient]);
}
