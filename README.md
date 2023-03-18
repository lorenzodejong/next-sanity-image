# next-sanity-image

Utility for using images hosted on the [Sanity.io CDN](https://sanity.io) with the [Next.js image component](https://nextjs.org/docs/api-reference/next/image). This library:

-   Supports all [layout options](https://nextjs.org/docs/api-reference/next/image#layout) from the `next/image` component.
-   Implements the [loader callback](https://nextjs.org/docs/api-reference/next/image#loader) to resolve the corresponding Sanity CDN URL's.
-   Respects the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) as specified in your Next config.
-   Respects the [quality](https://nextjs.org/docs/api-reference/next/image#quality) as specified in the `next/image` props.
-   Allows transforming the image using the [@sanity/image-url builder](https://www.npmjs.com/package/@sanity/image-url).
-   Automatically sets the width and the height of the Next image component to the corresponding aspect ratio.
-   Supports Webp formats using automatic content negotation.
-   Is fully typed and exposes [relevant types](#types).

## Installation

```
npm install --save next-sanity-image
```

This library also expects you to pass in a [SanityClient instance](https://www.npmjs.com/package/@sanity/client), if you haven't installed this already:

```
npm install --save @sanity/client
```

Finally configure your next.config.js to allow loading images from the Sanity.io CDN

```javascript
// next.config.js
module.exports = {
	images: {
		domains: ['cdn.sanity.io']
	}
};
```

## Upgrading

### Upgrading from 4.x.x to 5.x.x

Version 5.0.0 of this library has removed support for the blur options. The reason for this is that this could not be correctly standardised from the library, the only way to support blur up was to request a low quality placeholder image from the Sanity CDN. Sanity already provides a base 64 lqip from the asset's metadata (https://www.sanity.io/docs/image-metadata#74bfd1db9b97).

Checkout the [Responsive layout](#responsive-layout) example on how to use the lqip in your Image component.

## Usage

All `next/image` component layouts are supported. Below you can find a usage example for each of the supported layouts.

### Responsive layout

It's recommended to use the responsive layout for the best compatibility with different devices and resolutions. It's required to set the `sizes` attribute using this layout (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-sizes).

```jsx
import { createClient } from '@sanity/client';
import Img from 'next/image';
import { useNextSanityImage } from 'next-sanity-image';

// If you're using a private dataset you probably have to configure a separate write/read client.
// https://www.sanity.io/help/js-client-usecdn-token
const configuredSanityClient = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
	useCdn: true
});

const Page = ({ mySanityData }) => {
	const imageProps = useNextSanityImage(configuredSanityClient, mySanityData.image);

	return (
		<Img
			{...imageProps}
			style={{ width: '100%', height: 'auto' }} // layout="responsive" prior to Next 13.0.0
			sizes="(max-width: 800px) 100vw, 800px"
			placeholder="blur"
			blurDataURL={mySanityData.image.asset.metadata.lqip}
		/>
	);
};

// Replace this with your logic for fetching data from the Sanity API.
export const getServerSideProps = async function (context) {
	const { slug = '' } = context.query;

	const data = await configuredSanityClient.fetch(
		`{
			"mySanityData": *[_type == "mySanityType" && slug.current == $slug][0] {
				image {
					asset->{
						...,
						metadata
					}
				}
			}
		}`,
		{ slug }
	);

	return { props: data };
};

export default Page;
```

### Intrinsic layout

```jsx
// ... see "Responsive layout"

const Page = ({ mySanityData }) => {
	const imageProps = useNextSanityImage(configuredSanityClient, mySanityData.image);

	return (
		<Img
			{...imageProps}
			style={{ maxWidth: '100%', height: 'auto' }} // layout="intrinsic" prior to Next 13.0.0
			placeholder="blur"
			blurDataURL={mySanityData.image.asset.metadata.lqip}
		/>
	);
};

// ... see "Responsive layout"
```

### Fixed layout

```jsx
// ... see "Responsive layout"

const Page = ({ mySanityData }) => {
	const imageProps = useNextSanityImage(configuredSanityClient, mySanityData.image);

	return (
		<Img
			{...imageProps}
			placeholder="blur"
			blurDataURL={mySanityData.image.asset.metadata.lqip}
		/>
	);
};

// ... see "Responsive layout"
```

### Fill layout

Omit the `width` and `height` props returned from `useNextSanityImage` when using a fill layout, as this fills the available space of the parent container. You probably also want to set the `objectFit` prop to specify how the object resizes inside the container.

```jsx
// ... see "Responsive layout"

const Page = ({ mySanityData }) => {
	const imageProps = useNextSanityImage(configuredSanityClient, mySanityData.image);

	return (
		<Img
			src={imageProps.src}
			loader={imageProps.loader}
			fill // layout="fill" prior to Next 13.0.0
			objectFit="contain"
		/>
	);
};

// ... see "Responsive layout"
```

## API

### useNextSanityImage

React hook which handles generating a URL for each of the defined sizes in the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) Next.js options.

#### sanityClient: [`SanityClient`](https://www.npmjs.com/package/@sanity/client)

Pass in a configured instance of the SanityClient, used for building the URL using the [@sanity/image-url builder](https://www.npmjs.com/package/@sanity/image-url).

#### image: [`SanityImageSource` | `null`](https://www.npmjs.com/package/@sanity/image-url#imagesource)

A reference to a Sanity image asset, can be retrieved by using the Sanity API. You can pass in any asset that is also supported by the [image() method of @sanity/image-url](https://www.npmjs.com/package/@sanity/image-url#imagesource). This parameter can be set to `null` in order to not load any image.

#### options: UseNextSanityImageOptions

##### imageBuilder?: `function(/* see below */)`

| property                          | type                                                                                    | description                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `imageUrlBuilder`                 | [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage)              | @sanity/image-url builder to apply image transformations.                                                      |
| `options`                         | `UseNextSanityImageBuilderOptions`                                                      | Options object with relevant context passed to the callback, see properties below.                             |
| `options.width`                   | <code>number &#124; null<code>                                                          | The width for the current `srcSet` entry, if set to `null` this is the entry for the `src` fallback attribute. |
| `options.originalImageDimensions` | `{ width: number, height: number, aspectRatio: number } : UseNextSanityImageDimensions` | Object containing dimensions of the original image passed to the `image` parameter.                            |
| `options.croppedImageDimensions`  | `{ width: number, height: number, aspectRatio: number } : UseNextSanityImageDimensions` | The cropped dimensions of the image, if a crop is supplied. Otherwise, the same as `originalImageDimensions`.  |
| `options.quality`                 | <code>number &#124; null<code>                                                          | The quality of the image as passed to the `quality` prop of the `next/image` component.                        |

An optional function callback which allows you to customize the image using the [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage). This function is called for every entry in the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes), and is used to define the URL's outputted in the `srcSet` attribute of the image.

Defaults to:

```javascript
(imageUrlBuilder, options) => {
	return imageUrlBuilder
		.width(options.width || Math.min(options.originalImageDimensions.width, 1920))
		.quality(options.quality || 75)
		.fit('clip');
};
```

For an example on how to use this, read the chapter on [Image transformations](#image-transformations).

#### Return value: UseNextSanityImageProps | null

If the `image` parameter is set to `null`, the return value of this hook will also be `null`. This allows you to handle any conditional rendering when no image is loaded. If an `image` is set, to following result (`UseNextSanityImageProps`) will be returned:

```javascript
{
	src: string,
	width: number,
	height: number,
	// https://nextjs.org/docs/api-reference/next/image#loader
	loader: ImageLoader
}
```

## Image transformations

Custom transformations to the resulting image can be made by implementing the `imageBuilder` callback function. Note that it's recommended to implement a memoized callback, either by implementing the function outside of the component function scope or by making use of [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback). Otherwise the props will be recomputed for every render.

```jsx
//...

const myCustomImageBuilder = (imageUrlBuilder, options) => {
	return imageUrlBuilder
		.width(options.width || Math.min(options.originalImageDimensions.width, 800))
		.blur(20)
		.flipHorizontal()
		.saturation(-100)
		.fit('clip');
};

const Page = ({ mySanityData }) => {
	const imageProps = useNextSanityImage(configuredSanityClient, mySanityData.image, {
		imageBuilder: myCustomImageBuilder
	});

	return <Img {...imageProps} layout="responsive" sizes="(max-width: 800px) 100vw, 800px" />;
};

//...
```

### Gotchas

-   Because [next/image](https://nextjs.org/docs/api-reference/next/image) only renders a single `<img />` element with a `srcSet` attribute, the `width` and `height` prop being returned by the React hook is uniform for each size. Cropping an image is possible using the [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage), however you have to return an image with the same aspect ratio for each of the defined sizes. Art direction is currently not supported (both by [next/image](https://nextjs.org/docs/api-reference/next/image) and this library).

If the functionality mentioned above is desired, please file an issue stating your specific use case so we can look at the desired behavior and possibilities.

## Types

The following types are exposed from the library:

-   [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage)
-   `UseNextSanityImageProps`
-   `UseNextSanityImageOptions`
-   `UseNextSanityImageBuilder`
-   `UseNextSanityImageBuilderOptions`
-   `UseNextSanityImageDimensions`
