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
	UseNextSanityImageBuilder,
	UseNextSanityImageOptions,
	UseNextSanityImageProps
} from './types';

export const DEFAULT_FALLBACK_IMAGE_QUALITY = 75;

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
	image: SanityImageSource,
	options?: UseNextSanityImageOptions
): UseNextSanityImageProps;

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: null,
	options?: UseNextSanityImageOptions
): null;

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: SanityImageSource | null,
	options?: UseNextSanityImageOptions
): UseNextSanityImageProps | null;

export function useNextSanityImage(
	sanityClient: SanityClientLike,
	image: SanityImageSource | null,
	options?: UseNextSanityImageOptions
): UseNextSanityImageProps | null {
	const imageBuilder = options?.imageBuilder || DEFAULT_IMAGE_BUILDER;

	return useMemo(() => {
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

		return {
			loader,
			src: baseImgBuilderInstance.url() as string,
			width,
			height
		};
	}, [imageBuilder, image, sanityClient]);
}
