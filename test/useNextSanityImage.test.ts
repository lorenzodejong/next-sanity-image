import { renderHook } from '@testing-library/react-hooks';
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import sanityClient from '@sanity/client';

import {
	DEFAULT_BLUR_UP_AMOUNT,
	DEFAULT_BLUR_UP_IMAGE_WIDTH,
	DEFAULT_BLUR_UP_IMAGE_QUALITY,
	getImageDimensions,
	useNextSanityImage,
	getCroppedDimensions
} from '../src/useNextSanityImage';
import {
	SanityImageCrop,
	SanityImageHotspot,
	SanityImageObject
} from '@sanity/image-url/lib/types/types';

const PROJECT_ID = 'projectid';
const DATASET = 'dataset';
const IMAGE_ID = 'uuid';

const DEFAULT_IMAGE_WIDTH = 1366;
const DEFAULT_IMAGE_HEIGHT = 768;
const DEFAULT_IMAGE_ASPECT_RATIO = DEFAULT_IMAGE_WIDTH / DEFAULT_IMAGE_HEIGHT;
const DEFAULT_CROP = {
	left: 0.1,
	right: 0.1,
	top: 0.1,
	bottom: 0.1
};
const DEFAULT_HOTSPOT = {
	x: 0.5,
	y: 0.5,
	width: 1,
	height: 1
};

const configuredSanityClient = sanityClient({
	projectId: PROJECT_ID,
	dataset: DATASET,
	useCdn: true,
	apiVersion: '2021-10-21'
});

const generateSanityImageSource = (width: number, height: number) => ({
	asset: {
		_ref: `image-uuid-${width}x${height}-png`,
		_type: 'reference'
	},
	_type: 'image'
});

const generateSanityImageObject = (
	width: number,
	height: number,
	crop: SanityImageCrop,
	hotspot: SanityImageHotspot
): SanityImageObject => ({
	...generateSanityImageSource(width, height),
	crop: crop,
	hotspot: hotspot
});

const generateSanityImageUrl = (
	queryString = '',
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT
) =>
	`https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${IMAGE_ID}-${width}x${height}.png${queryString}`;

describe('useNextSanityImage', () => {
	beforeEach(() => {
		process.env = Object.assign(process.env, {
			__NEXT_IMAGE_OPTS: {
				deviceSizes: [640, 1080, 1920],
				imageSizes: [16, 23, 48, 64, 96]
			}
		});
	});

	test('getImageDimensions returns the correct original dimensions', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);
		const dimensions = getImageDimensions(image.asset._ref);

		expect(dimensions).toEqual({
			width: DEFAULT_IMAGE_WIDTH,
			height: DEFAULT_IMAGE_HEIGHT,
			aspectRatio: DEFAULT_IMAGE_WIDTH / DEFAULT_IMAGE_HEIGHT
		});
	});

	test('getCroppedDimensions returns the correct cropped dimensions', () => {
		const image = generateSanityImageObject(
			DEFAULT_IMAGE_WIDTH,
			DEFAULT_IMAGE_HEIGHT,
			DEFAULT_CROP,
			DEFAULT_HOTSPOT
		);
		const imageDimensions = getImageDimensions(image.asset._ref);
		const croppedDimensions = getCroppedDimensions(image, imageDimensions);

		const expectedWidth = DEFAULT_IMAGE_WIDTH * 0.8;
		const expectedHeight = DEFAULT_IMAGE_HEIGHT * 0.8;

		expect(croppedDimensions).toEqual({
			width: expectedWidth,
			height: expectedHeight,
			aspectRatio: expectedWidth / expectedHeight
		});
	});

	test('useNextSanityImage returns the correct results after initialization', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);
		const { result } = renderHook(() => useNextSanityImage(configuredSanityClient, image));

		const expectedWidth = DEFAULT_IMAGE_WIDTH;

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?q=75&fit=clip&auto=format`),
			width: expectedWidth,
			height: Math.round(expectedWidth / DEFAULT_IMAGE_ASPECT_RATIO),
			blurDataURL: generateSanityImageUrl(
				`?w=${DEFAULT_BLUR_UP_IMAGE_WIDTH}&blur=${DEFAULT_BLUR_UP_AMOUNT}&q=${DEFAULT_BLUR_UP_IMAGE_QUALITY}&fit=clip&auto=format`
			),
			placeholder: 'blur'
		});
	});

	test('useNextSanityImage returns adjusted dimensions for cropped images', () => {
		const image = generateSanityImageObject(
			DEFAULT_IMAGE_WIDTH,
			DEFAULT_IMAGE_HEIGHT,
			DEFAULT_CROP,
			DEFAULT_HOTSPOT
		);
		const { result } = renderHook(() => useNextSanityImage(configuredSanityClient, image));

		const croppedWidth = DEFAULT_IMAGE_WIDTH * 0.8;
		const croppedHeight = DEFAULT_IMAGE_HEIGHT * 0.8;
		const croppedAspectRatio = croppedWidth / croppedHeight;

		expect(result.current.width).toEqual(croppedWidth);
		expect(result.current.height).toEqual(Math.round(croppedWidth / croppedAspectRatio));
	});

	test('useNextSanityImage returns the correct results after initialization with a large image', () => {
		const width = DEFAULT_IMAGE_WIDTH * 2;
		const height = DEFAULT_IMAGE_HEIGHT * 2;

		const image = generateSanityImageSource(width, height);
		const { result } = renderHook(() => useNextSanityImage(configuredSanityClient, image));

		const expectedWidth = width;

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?q=75&fit=clip&auto=format`, width, height),
			width: expectedWidth,
			height: Math.round(expectedWidth / DEFAULT_IMAGE_ASPECT_RATIO),
			blurDataURL: generateSanityImageUrl(
				`?w=${DEFAULT_BLUR_UP_IMAGE_WIDTH}&blur=${DEFAULT_BLUR_UP_AMOUNT}&q=${DEFAULT_BLUR_UP_IMAGE_QUALITY}&fit=clip&auto=format`,
				width,
				height
			),
			placeholder: 'blur'
		});
	});

	test('useNextSanityImage returns the correct results using a custom imageBuilder', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);
		const width = 813;
		const imageBuilder = (imageUrlBuilder: ImageUrlBuilder) => {
			return imageUrlBuilder.width(width).blur(20).flipHorizontal().fit('crop').quality(20);
		};

		const { result } = renderHook(() =>
			useNextSanityImage(configuredSanityClient, image, { imageBuilder })
		);

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?flip=h&w=813&blur=20&q=20&fit=crop&auto=format`),
			width: width,
			height: Math.round(width / DEFAULT_IMAGE_ASPECT_RATIO),
			blurDataURL: generateSanityImageUrl(
				`?w=${DEFAULT_BLUR_UP_IMAGE_WIDTH}&blur=${DEFAULT_BLUR_UP_AMOUNT}&q=${DEFAULT_BLUR_UP_IMAGE_QUALITY}&fit=clip&auto=format`
			),
			placeholder: 'blur'
		});
	});

	test('useNextSanityImage returns the correct results using a custom blurImageBuilder', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);
		const width = 400;
		const blur = 90;
		const quality = 20;
		const fit = 'crop';

		const blurUpImageBuilder = (imageUrlBuilder: ImageUrlBuilder) => {
			return imageUrlBuilder
				.width(width)
				.blur(blur)
				.flipHorizontal()
				.fit(fit)
				.quality(quality);
		};

		const { result } = renderHook(() =>
			useNextSanityImage(configuredSanityClient, image, { blurUpImageBuilder })
		);

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?q=75&fit=clip&auto=format`),
			width: DEFAULT_IMAGE_WIDTH,
			height: DEFAULT_IMAGE_HEIGHT,
			blurDataURL: generateSanityImageUrl(
				`?flip=h&w=${width}&blur=${blur}&q=${quality}&fit=${fit}&auto=format`
			),
			placeholder: 'blur'
		});
	});

	test('useNextSanityImage returns the correct results using a custom blur image options', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);

		const blurUpAmount = 76;
		const blurUpImageQuality = 12;
		const blurUpImageWidth = 329;

		const { result } = renderHook(() =>
			useNextSanityImage(configuredSanityClient, image, {
				blurUpAmount,
				blurUpImageQuality,
				blurUpImageWidth
			})
		);

		const expectedWidth = DEFAULT_IMAGE_WIDTH;

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?q=75&fit=clip&auto=format`),
			width: expectedWidth,
			height: Math.round(expectedWidth / DEFAULT_IMAGE_ASPECT_RATIO),
			blurDataURL: generateSanityImageUrl(
				`?w=${blurUpImageWidth}&blur=${blurUpAmount}&q=${blurUpImageQuality}&fit=clip&auto=format`
			),
			placeholder: 'blur'
		});
	});

	test('useNextSanityImage returns expected results from the loader callback', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);

		const { result } = renderHook(() => useNextSanityImage(configuredSanityClient, image));

		const width = 300;
		const loaderResult = result.current.loader({ src: '', width });

		expect(loaderResult).toEqual(
			generateSanityImageUrl(`?w=${width}&q=75&fit=clip&auto=format`)
		);
	});

	test('useNextSanityImage works when the image object is initialized empty', () => {
		const { result } = renderHook(() => useNextSanityImage(configuredSanityClient, null));

		expect(result.current).toBeNull();
	});
});
