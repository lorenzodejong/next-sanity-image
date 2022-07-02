import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import { ImageLoader } from 'next/image';

export { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';

export type UseNextSanityImageDimensions = {
	width: number;
	height: number;
	aspectRatio: number;
};

export type UseNextSanityImageBuilderOptions = {
	width: number | null;
	originalImageDimensions: UseNextSanityImageDimensions;
	croppedImageDimensions: UseNextSanityImageDimensions;
	quality: number | null;
};

export type UseNextSanityBlurUpImageBuilderOptions = {
	width: number | null;
	originalImageDimensions: UseNextSanityImageDimensions;
	croppedImageDimensions: UseNextSanityImageDimensions;
	quality: number | null;
	blurAmount: number | null;
};

export type UseNextSanityImageBuilderBase<Options> = (
	imageUrlBuilder: ImageUrlBuilder,
	options: Options
) => ImageUrlBuilder;

export type UseNextSanityImageBuilder =
	UseNextSanityImageBuilderBase<UseNextSanityImageBuilderOptions>;

export type UseNextSanityBlurUpImageBuilder =
	UseNextSanityImageBuilderBase<UseNextSanityBlurUpImageBuilderOptions>;

export type UseNextSanityImageOptions = {
	imageBuilder?: UseNextSanityImageBuilder;
	blurUpImageBuilder?: UseNextSanityBlurUpImageBuilder;
	blurUpImageQuality?: number;
	blurUpImageWidth?: number;
	blurUpAmount?: number;
	enableBlurUp?: true | false;
};

export type UseNextSanityImageProps = {
	loader: ImageLoader;
	src: string;
	width: number;
	height: number;
	blurDataURL?: string;
	placeholder: 'blur' | 'empty';
};
