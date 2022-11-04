import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import { ImageLoader } from 'next/image';

export { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';

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
