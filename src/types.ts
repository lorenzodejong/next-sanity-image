import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import {
	SanityClientLike,
	SanityModernClientLike,
	SanityProjectDetails
} from '@sanity/image-url/lib/types/types';
import { ImageLoader } from 'next/image';

export { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';

export type SanityClientOrProjectDetails =
	| SanityClientLike
	| SanityProjectDetails
	| SanityModernClientLike;

export interface UseNextSanityImageDimensions {
	width: number;
	height: number;
	aspectRatio: number;
}

export interface UseNextSanityImageBuilderOptions {
	width: number | null;
	originalImageDimensions: UseNextSanityImageDimensions;
	croppedImageDimensions: UseNextSanityImageDimensions;
	quality: number | null;
}

export type UseNextSanityImageBuilder = (
	imageUrlBuilder: ImageUrlBuilder,
	options: UseNextSanityImageBuilderOptions
) => ImageUrlBuilder;

export interface UseNextSanityImageOptions {
	imageBuilder?: UseNextSanityImageBuilder;
}

export interface UseNextSanityImageProps {
	loader: ImageLoader;
	src: string;
	width: number;
	height: number;
}
