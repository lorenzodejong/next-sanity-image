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

export const DEFAULT_FALLBACK_IMAGE_QUALITY = 75;

const DEFAULT_BLUR_IMAGE_BUILDER: UseNextSanityBlurUpImageBuilder = (imageUrlBuilder, options) => {
	return imageUrlBuilder
		.width(options.width || DEFAULT_BLUR_UP_IMAGE_WIDTH)
		.quality(options.quality || DEFAULT_BLUR_UP_IMAGE_QUALITY)
		.blur(options.blurAmount || DEFAULT_BLUR_UP_AMOUNT)
		.fit('clip');
};

const DEFAULT_IMAGE_BUILDER: UseNextSanityImageBuilder = (imageUrlBuilder, options) => {
	const result = imageUrlBuilder
		.quality(options.quality || DEFAULT_FALLBACK_IMAGE_QUALITY)
		.fit('clip');

	if (options.width !== null) {
		return result.width(options.width);
	}

	return result;
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

export function getImageDimensions(id: string): UseNextSanityImageDimensions {
	const dimensions = id.split('-')[2];

	const [width, height] = dimensions.split('x').map((num: string) => parseInt(num, 10));
	const aspectRatio = width / height;

	return { width, height, aspectRatio };
}

export function getCroppedDimensions(
	image: SanityImageSource,
	baseDimensions: UseNextSanityImageDimensions
): UseNextSanityImageDimensions {
	const crop = (image as SanityImageObject).crop;

	if (!crop) {
		return baseDimensions;
	}

	const { width, height } = baseDimensions;
	const croppedWidth = width * (1 - (crop.left + crop.right));
	const croppedHeight = height * (1 - (crop.top + crop.bottom));

	return {
		width: croppedWidth,
		height: croppedHeight,
		aspectRatio: croppedWidth / croppedHeight
	};
}

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: null,
	options?: UseNextSanityImageOptions
): null;

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: SanityImageSource,
	options?: UseNextSanityImageOptions & { enableBlurUp?: true }
): Required<UseNextSanityImageProps> & { placeholder: 'blur' };

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: SanityImageSource,
	options?: UseNextSanityImageOptions & { enableBlurUp?: false }
): Omit<UseNextSanityImageProps, 'blurDataURL'> & { placeholder: 'empty' };

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: SanityImageSource,
	options?: UseNextSanityImageOptions
): UseNextSanityImageProps;

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: SanityImageSource | null,
	options: UseNextSanityImageOptions = {}
): UseNextSanityImageProps | null {
	const enableBlurUp = options.enableBlurUp === undefined ? true : options.enableBlurUp;

	const blurAmount = options.blurUpAmount || null;
	const blurUpImageQuality = options.blurUpImageQuality || null;
	const blurUpImageWidth = options.blurUpImageWidth || null;

	const blurUpImageBuilder = options.blurUpImageBuilder || DEFAULT_BLUR_IMAGE_BUILDER;
	const imageBuilder = options.imageBuilder || DEFAULT_IMAGE_BUILDER;

	return useMemo<UseNextSanityImageProps | null>(() => {
		if (!image) {
			return null;
		}

		// If the image has an alt text but does not contain an actual asset, the id will be
		// undefined: https://github.com/bundlesandbatches/next-sanity-image/issues/14
		const id = image ? getSanityRefId(image) : null;
		if (!id) {
			return null;
		}

		const originalImageDimensions = getImageDimensions(id);
		const croppedImageDimensions = getCroppedDimensions(image, originalImageDimensions);

		const loader: ImageLoader = ({ width, quality }) => {
			return (
				imageBuilder(imageUrlBuilder(sanityClient).image(image).auto('format'), {
					width,
					originalImageDimensions,
					croppedImageDimensions,
					quality: quality || null
				}).url() || ''
			);
		};

		const baseImgBuilderInstance = imageBuilder(
			imageUrlBuilder(sanityClient).image(image).auto('format'),
			{
				width: null,
				originalImageDimensions,
				croppedImageDimensions,
				quality: null
			}
		);

		const width =
			baseImgBuilderInstance.options.width ||
			(baseImgBuilderInstance.options.maxWidth
				? Math.min(baseImgBuilderInstance.options.maxWidth, croppedImageDimensions.width)
				: croppedImageDimensions.width);

		const height =
			baseImgBuilderInstance.options.height ||
			(baseImgBuilderInstance.options.maxHeight
				? Math.min(baseImgBuilderInstance.options.maxHeight, croppedImageDimensions.height)
				: Math.round(width / croppedImageDimensions.aspectRatio));

		const props = {
			loader,
			src: baseImgBuilderInstance.url() as string,
			width,
			height
		};

		if (enableBlurUp) {
			const blurImgBuilderInstance = blurUpImageBuilder(
				imageUrlBuilder(sanityClient).image(image).auto('format'),
				{
					width: blurUpImageWidth,
					originalImageDimensions,
					croppedImageDimensions,
					quality: blurUpImageQuality,
					blurAmount: blurAmount
				}
			);

			return {
				...props,
				blurDataURL: blurImgBuilderInstance.url() as string,
				placeholder: 'blur'
			};
		}

		return { ...props, placeholder: 'empty' };
	}, [
		blurAmount,
		blurUpImageBuilder,
		blurUpImageQuality,
		blurUpImageWidth,
		enableBlurUp,
		imageBuilder,
		image,
		sanityClient
	]);
}
