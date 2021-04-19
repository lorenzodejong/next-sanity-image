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

export const DEFAULT_FALLBACK_IMAGE_WIDTH = 1920;

export type UseNextSanityImageDimensions = {
	width: number;
	height: number;
	aspectRatio: number;
};

export type UseNextSanityImageBuilderOptions = {
	width: number | null;
	originalImageDimensions: UseNextSanityImageDimensions;
};

export type UseNextSanityImageBuilder = (
	imageUrlBuilder: ImageUrlBuilder,
	options: UseNextSanityImageBuilderOptions
) => ImageUrlBuilder;

export type UseNextSanityImageOptions = {
	imageBuilder?: UseNextSanityImageBuilder;
};

export type UseNextSanityImageProps = {
	loader: ImageLoader;
	src: string;
	width: number;
	height: number;
	layout: 'responsive';
};

const DEFAULT_IMAGE_BUILDER = (
	imageUrlBuilder: ImageUrlBuilder,
	options: UseNextSanityImageBuilderOptions
) => {
	return imageUrlBuilder
		.width(
			options.width ||
				Math.min(options.originalImageDimensions.width, DEFAULT_FALLBACK_IMAGE_WIDTH)
		)
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
	sanityClient: SanityClient,
	image: SanityImageSource,
	options: UseNextSanityImageOptions = {}
): UseNextSanityImageProps {
	const imageBuilder = options.imageBuilder || DEFAULT_IMAGE_BUILDER;

	return useMemo<UseNextSanityImageProps>(() => {
		const originalImageDimensions = getImageDimensions(image);

		const loader: ImageLoader = ({ width }) => {
			return (
				imageBuilder(imageUrlBuilder(sanityClient).image(image).auto('format'), {
					width,
					originalImageDimensions
				}).url() || ''
			);
		};

		const baseImgBuilder = imageBuilder(
			imageUrlBuilder(sanityClient).image(image).auto('format'),
			{
				width: null,
				originalImageDimensions
			}
		);

		const width =
			baseImgBuilder.options.width ||
			(baseImgBuilder.options.maxWidth
				? Math.min(baseImgBuilder.options.maxWidth, originalImageDimensions.width)
				: originalImageDimensions.width);

		const height =
			baseImgBuilder.options.height ||
			(baseImgBuilder.options.maxHeight
				? Math.min(baseImgBuilder.options.maxHeight, originalImageDimensions.height)
				: Math.round(width / originalImageDimensions.aspectRatio));

		return {
			loader,
			src: baseImgBuilder.url() || '',
			width,
			height,
			layout: 'responsive'
		};
	}, [imageBuilder, image, sanityClient]);
}
