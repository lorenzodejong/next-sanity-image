import { createClient } from '@sanity/client';
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import { renderHook } from '@testing-library/react-hooks';

import {
	SanityImageCrop,
	SanityImageHotspot,
	SanityImageObject
} from '@sanity/image-url/lib/types/types';
import {
	getCroppedDimensions,
	getImageDimensions,
	useNextSanityImage
} from '../src/useNextSanityImage';

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

const sanityClientConfig = {
	projectId: PROJECT_ID,
	dataset: DATASET,
	useCdn: true,
	apiVersion: '2021-10-21'
};
const configuredSanityClient = createClient(sanityClientConfig);

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
			height: Math.round(expectedWidth / DEFAULT_IMAGE_ASPECT_RATIO)
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
			height: Math.round(expectedWidth / DEFAULT_IMAGE_ASPECT_RATIO)
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
			height: Math.round(width / DEFAULT_IMAGE_ASPECT_RATIO)
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

	test('useNextSanityImage can be used with a client configuration instead of an instantiated client', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);
		const { result } = renderHook(() => useNextSanityImage(sanityClientConfig, image));

		const expectedWidth = DEFAULT_IMAGE_WIDTH;

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?q=75&fit=clip&auto=format`),
			width: expectedWidth,
			height: Math.round(expectedWidth / DEFAULT_IMAGE_ASPECT_RATIO)
		});
	});
});
