import { ImageLoader } from 'next/image';
import { useMemo } from 'react';
import imageUrlBuilder from '@sanity/image-url';
import {
	SanityAsset,
	SanityClientLike,
	SanityImageSource,
	SanityImageObject,
	SanityReference
} from '@sanity/image-url/lib/types/types';

import {
	UseNextSanityImageDimensions,
	UseNextSanityBlurUpImageBuilder,
	UseNextSanityImageBuilder,
	UseNextSanityImageOptions,
	UseNextSanityImageProps
} from './types';

export const DEFAULT_BLUR_UP_IMAGE_WIDTH = 64;
export const DEFAULT_BLUR_UP_IMAGE_QUALITY = 30;
export const DEFAULT_BLUR_UP_AMOUNT = 50;

export const DEFAULT_FALLBACK_IMAGE_WIDTH = 1920;
export const DEFAULT_FALLBACK_IMAGE_QUALITY = 75;

const DEFAULT_BLUR_IMAGE_BUILDER: UseNextSanityBlurUpImageBuilder = (imageUrlBuilder, options) => {
	return imageUrlBuilder
		.width(options.width || DEFAULT_BLUR_UP_IMAGE_WIDTH)
		.quality(options.quality || DEFAULT_BLUR_UP_IMAGE_QUALITY)
		.blur(options.blurAmount || DEFAULT_BLUR_UP_AMOUNT)
		.fit('clip');
};

const DEFAULT_IMAGE_BUILDER: UseNextSanityImageBuilder = (imageUrlBuilder, options) => {
	return imageUrlBuilder
		.width(
			options.width ||
				Math.min(options.originalImageDimensions.width, DEFAULT_FALLBACK_IMAGE_WIDTH)
		)
		.quality(options.quality || DEFAULT_FALLBACK_IMAGE_QUALITY)
		.fit('clip');
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

export function getImageDimensions(image: SanityImageSource): UseNextSanityImageDimensions {
	const id = getSanityRefId(image);
	const dimensions = id.split('-')[2];

	const [width, height] = dimensions.split('x').map((num: string) => parseInt(num, 10));
	const aspectRatio = width / height;

	return { width, height, aspectRatio };
}

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: SanityImageSource,
	options: UseNextSanityImageOptions = {}
): UseNextSanityImageProps {
	const blurAmount = options.blurUpAmount || null;
	const blurUpImageBuilder = options.blurUpImageBuilder || DEFAULT_BLUR_IMAGE_BUILDER;
	const blurUpImageQuality = options.blurUpImageQuality || null;
	const blurUpImageWidth = options.blurUpImageWidth || null;

	const imageBuilder = options.imageBuilder || DEFAULT_IMAGE_BUILDER;

	return useMemo<UseNextSanityImageProps>(() => {
		const originalImageDimensions = getImageDimensions(image);

		const loader: ImageLoader = ({ width, quality }) => {
			return (
				imageBuilder(imageUrlBuilder(sanityClient).image(image).auto('format'), {
					width,
					originalImageDimensions,
					quality: quality || null
				}).url() || ''
			);
		};

		const baseImgBuilderInstance = imageBuilder(
			imageUrlBuilder(sanityClient).image(image).auto('format'),
			{
				width: null,
				originalImageDimensions,
				quality: null
			}
		);

		const width =
			baseImgBuilderInstance.options.width ||
			(baseImgBuilderInstance.options.maxWidth
				? Math.min(baseImgBuilderInstance.options.maxWidth, originalImageDimensions.width)
				: originalImageDimensions.width);

		const height =
			baseImgBuilderInstance.options.height ||
			(baseImgBuilderInstance.options.maxHeight
				? Math.min(baseImgBuilderInstance.options.maxHeight, originalImageDimensions.height)
				: Math.round(width / originalImageDimensions.aspectRatio));

		const blurImgBuilderInstance = blurUpImageBuilder(
			imageUrlBuilder(sanityClient).image(image).auto('format'),
			{
				width: blurUpImageWidth,
				originalImageDimensions,
				quality: blurUpImageQuality,
				blurAmount: blurAmount
			}
		);

		return {
			loader,
			src: baseImgBuilderInstance.url() as string,
			width,
			height,
			blurDataURL: blurImgBuilderInstance.url() as string
		};
	}, [
		blurAmount,
		blurUpImageBuilder,
		blurUpImageQuality,
		blurUpImageWidth,
		imageBuilder,
		image,
		sanityClient
	]);
}
