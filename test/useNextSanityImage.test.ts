import { renderHook } from '@testing-library/react-hooks';
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import sanityClient from '@sanity/client';

import {
	DEFAULT_BLUR_UP_AMOUNT,
	DEFAULT_BLUR_UP_IMAGE_WIDTH,
	DEFAULT_BLUR_UP_IMAGE_QUALITY,
	DEFAULT_FALLBACK_IMAGE_WIDTH,
	getImageDimensions,
	useNextSanityImage
} from '../src/useNextSanityImage';

const PROJECT_ID = 'PROJECTID';
const DATASET = 'DATASET';
const IMAGE_ID = 'UUID';

const DEFAULT_IMAGE_WIDTH = 1366;
const DEFAULT_IMAGE_HEIGHT = 768;
const DEFAULT_IMAGE_ASPECT_RATIO = DEFAULT_IMAGE_WIDTH / DEFAULT_IMAGE_HEIGHT;

const configuredSanityClient = sanityClient({
	projectId: PROJECT_ID,
	dataset: DATASET,
	useCdn: true
});

const generateSanityImageSource = (width: number, height: number) => ({
	asset: {
		_ref: `image-UUID-${width}x${height}-png`,
		_type: 'reference'
	},
	_type: 'image'
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
		const dimensions = getImageDimensions(image);

		expect(dimensions).toEqual({
			width: DEFAULT_IMAGE_WIDTH,
			height: DEFAULT_IMAGE_HEIGHT,
			aspectRatio: DEFAULT_IMAGE_WIDTH / DEFAULT_IMAGE_HEIGHT
		});
	});

	test('useNextSanityImage returns the correct results after initialization', () => {
		const image = generateSanityImageSource(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT);
		const { result } = renderHook(() => useNextSanityImage(configuredSanityClient, image));

		const expectedWidth = Math.min(DEFAULT_FALLBACK_IMAGE_WIDTH, DEFAULT_IMAGE_WIDTH);

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?w=${expectedWidth}&q=75&fit=clip&auto=format`),
			width: expectedWidth,
			height: Math.round(expectedWidth / DEFAULT_IMAGE_ASPECT_RATIO),
			blurDataURL: generateSanityImageUrl(
				`?w=${DEFAULT_BLUR_UP_IMAGE_WIDTH}&blur=${DEFAULT_BLUR_UP_AMOUNT}&q=${DEFAULT_BLUR_UP_IMAGE_QUALITY}&fit=clip&auto=format`
			),
			placeholder: 'blur'
		});
	});

	test('useNextSanityImage returns the correct results after initialization with a large image', () => {
		const width = DEFAULT_IMAGE_WIDTH * 2;
		const height = DEFAULT_IMAGE_HEIGHT * 2;

		const image = generateSanityImageSource(width, height);
		const { result } = renderHook(() => useNextSanityImage(configuredSanityClient, image));

		const expectedWidth = Math.min(DEFAULT_FALLBACK_IMAGE_WIDTH, width);

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(
				`?w=${expectedWidth}&q=75&fit=clip&auto=format`,
				width,
				height
			),
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
			src: generateSanityImageUrl(`?w=${DEFAULT_IMAGE_WIDTH}&q=75&fit=clip&auto=format`),
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

		const expectedWidth = Math.min(DEFAULT_FALLBACK_IMAGE_WIDTH, DEFAULT_IMAGE_WIDTH);

		expect(result.current).toEqual({
			loader: expect.any(Function),
			src: generateSanityImageUrl(`?w=${expectedWidth}&q=75&fit=clip&auto=format`),
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
