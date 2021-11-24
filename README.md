# next-sanity-image

Utility for using images hosted on the [Sanity.io CDN](https://sanity.io) with the [Next.js image component](https://nextjs.org/docs/api-reference/next/image). This library:
* Supports all [layout options](https://nextjs.org/docs/api-reference/next/image#layout) from the `next/image` component.
* Implements the [loader callback](https://nextjs.org/docs/api-reference/next/image#loader) to resolve the corresponding Sanity CDN URL's.
* Respects the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) as specified in your Next config.
* Respects the [quality](https://nextjs.org/docs/api-reference/next/image#quality) as specified in the `next/image` props.
* Allows transforming the image using the [@sanity/image-url builder](https://www.npmjs.com/package/@sanity/image-url).
* Automatically sets the width and the height of the Next image component to the corresponding aspect ratio.
* Supports Webp formats using automatic content negotation.
* Supports blur-up placeholder images introduced in Next.js 11.0.0 out of the box (with optional image transformations)
* Is fully typed and exposes [relevant types](#types).


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
module.exports = {
	images: {
		domains: ['cdn.sanity.io'],
		loader: 'custom'
	}
};
```


## Usage

All `next/image` component layouts are supported (https://nextjs.org/docs/api-reference/next/image#layout). Below you can find a usage example for each of the supported layouts.

### Responsive layout

It's recommended to use the responsive layout for the best compatibility with different devices and resolutions. It's required to set the `sizes` attribute using this layout (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-sizes).

```jsx
import sanityClient from '@sanity/client';
import Img from 'next/image';
import { useNextSanityImage } from 'next-sanity-image';

// If you're using a private dataset you probably have to configure a separate write/read client.
// https://www.sanity.io/help/js-client-usecdn-token
const configuredSanityClient = sanityClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
	useCdn: true
});

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image
	);

	return (
		<Img {...imageProps} layout="responsive" sizes="(max-width: 800px) 100vw, 800px" />
	);
);

// Replace this with your logic for fetching data from the Sanity API.
export const getServerSideProps = async function (context) {
	const { slug = '' } = context.query;

	const data = await configuredSanityClient.fetch(
		`{
			"mySanityData": *[_type == "mySanityType" && slug.current == $slug][0] {
				image
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

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image
	);

	return (
		<Img {...imageProps} layout="intrinsic" />
	);
);

// ... see "Responsive layout"
```

### Fixed layout

```jsx
// ... see "Responsive layout"

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image
	);

	return (
		<Img {...imageProps} layout="fixed" />
	);
);

// ... see "Responsive layout"
```

### Fill layout

Omit the `width` and `height` props returned from `useNextSanityImage` when using a fill layout, as this fills the available space of the parent container. You probably also want to set the `objectFit` prop to specify how the object resizes inside the container.

```jsx
// ... see "Responsive layout"

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image
	);

	return (
		<Img src={imageProps.src} loader={imageProps.loader} layout="fill" objectFit="contain" />
	);
);

// ... see "Responsive layout"
```


## Customizing the blur-up placeholder image

Blur-up placeholders are enabled by default as of Next.js 11.0.0. It's possible to customize the blur amount, quality and width of the placeholder image by modifying the options of `useNextSanityImage`. If you require more advanced image transformations, check out the chapter on [Image transformations](#image-transformations).

```jsx
// ... see "Responsive layout"

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image,
		{
			blurUpImageWidth: 124,
			blurUpImageQuality: 40,
			blurUpAmount: 24
		}
	);

	return (
		<Img {...imageProps} layout="responsive" sizes="(max-width: 800px) 100vw, 800px" />
	);
);

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

##### enableBlurUp: boolean

Enables the blur-up placeholder image. Defaults to true.


##### blurUpImageQuality: number | null

The quality of the blur-up placeholder image, ranging from 0 - 100. Defaults to 30.


##### blurUpImageWidth: number | null

The width of the blur-up placeholder image (in pixels). Defaults to 64.


##### blurUpAmount: number | null

The amount of blur applied to the blur-up placeholder image, ranging from 0 - 100. Defaults to 50.


##### imageBuilder?: `function(/* see below */)`

| property                           | type                                                                                     | description                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `imageUrlBuilder`                  | [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage)               | @sanity/image-url builder to apply image transformations.                                                       |
| `options`                          | `UseNextSanityImageBuilderOptions`                                                       | Options object with relevant context passed to the callback, see properties below.                              |
| `options.width`                    | <code>number &#124; null<code>                                                           | The width for the current `srcSet` entry, if set to `null` this is the entry for the `src` fallback attribute.  |
| `options.originalImageDimensions`  | `{ width: number, height: number, aspectRatio: number } : UseNextSanityImageDimensions`  | Object containing dimensions of the original image passed to the `image` parameter.                             |
| `options.croppedImageDimensions`	 | `{ width: number, height: number, aspectRatio: number } : UseNextSanityImageDimensions`  | The cropped dimensions of the image, if a crop is supplied. Otherwise, the same as `originalImageDimensions`.   |
| `options.quality`                  | <code>number &#124; null<code>                                                           | The quality of the image as passed to the `quality` prop of the `next/image` component.                         |

An optional function callback which allows you to customize the image using the [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage). This function is called for every entry in the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes), and is used to define the URL's outputted in the `srcSet` attribute of the image.

Defaults to:
```javascript
(imageUrlBuilder, options) => {
	return imageUrlBuilder
		.width(options.width || Math.min(options.originalImageDimensions.width, 1920))
		.quality(options.quality || 75)
		.fit('clip');
}
```

For an example on how to use this, read the chapter on [Image transformations](#image-transformations).


##### blurUpImageBuilder?: `function(/* see below */)`

| property                           | type                                                                                     | description                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `imageUrlBuilder`                  | [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage)               | @sanity/image-url builder to apply image transformations.                                                       |
| `options`                          | `UseNextSanityImageBuilderOptions`                                                       | Options object with relevant context passed to the callback, see properties below.                              |
| `options.width`                    | <code>number &#124; null<code>                                                           | The width for the current `srcSet` entry, if set to `null` this is the entry for the `src` fallback attribute.  |
| `options.originalImageDimensions`  | `{ width: number, height: number, aspectRatio: number } : UseNextSanityImageDimensions`  | Object containing dimensions of the original image passed to the `image` parameter.                             |
| `options.croppedImageDimensions`	 | `{ width: number, height: number, aspectRatio: number } : UseNextSanityImageDimensions`  | The cropped dimensions of the image, if a crop is supplied. Otherwise, the same as `originalImageDimensions`.   |
| `options.quality`                  | <code>number &#124; null<code>                                                           | The quality of the image as passed to the `quality` prop of the `next/image` component.                         |
| `options.blurAmount`               | <code>number &#124; null<code>                                                           | The amount of blur applied to the image (ranging from 0 - 100).                                                 |

An optional function callback which allows you to customize the blur-up placeholder image using the [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage). This function is called for every entry in the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes), and is used to define the URL outputted in the `blurDataURL` attribute of the image.

It's recommended to use the `blurUpImageQuality`, `blurUpImageWidth` and/or `blurUpAmount` options to modify the blur-up placeholder. Only use this image builder when you also want to apply other transformations to the blur-up placeholder image.

**Please note that it's recommended to keep the width and quality of the blur-up placeholder low, as this placeholder image will be replaced directly after load!**

Defaults to:
```javascript
(imageUrlBuilder, options) => {
	return imageUrlBuilder
		.width(options.width || 64)
		.quality(options.quality || 30)
		.blur(options.blurAmount || 50)
		.fit('clip');
};
```

For more information on how to use this, read the chapter on [Image transformations](#image-transformations).



#### Return value: UseNextSanityImageProps | null

If the `image` parameter is set to `null`, the return value of this hook will also be `null`. This allows you to handle any conditional rendering when no image is loaded. If an `image` is set, to following result (`UseNextSanityImageProps`) will be returned:

```javascript
{
	src: string,
	width: number,
	height: number,

	// Properties below change based on the specified 'enableBlurUp' option
	placeholder: 'blur' | 'empty',
	blurDataURL?: string,

	// https://nextjs.org/docs/api-reference/next/image#loader
	loader: ImageLoader
}
```


## Image transformations

Custom transformations to the resulting image can be made by implementing the `imageBuilder` callback function. Note that it's recommended to implement a memoized callback, either by implementing the function outside of the component function scope or by making use of [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback). Otherwise the props will be recomputed for every render.

The same can be done for the blur-up placeholder image by using the `blurUpImageBuilder` option.

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

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image,
		{ imageBuilder: myCustomImageBuilder }
	);

	return (
		<Img {...imageProps} layout="responsive" sizes="(max-width: 800px) 100vw, 800px" />
	);
);

//...
```

### Gotchas

* Because [next/image](https://nextjs.org/docs/api-reference/next/image) only renders a single `<img />` element with a `srcSet` attribute, the `width` and `height` prop being returned by the React hook is uniform for each size. Cropping an image is possible using the [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage), however you have to return an image with the same aspect ratio for each of the defined sizes. Art direction is currently not supported (both by [next/image](https://nextjs.org/docs/api-reference/next/image) and this library).

If the functionality mentioned above is desired, please file an issue stating your specific use case so we can look at the desired behavior and possibilities.

## Types

The following types are exposed from the library:

* [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage)
* `UseNextSanityImageProps`
* `UseNextSanityImageOptions`
* `UseNextSanityBlurUpImageBuilder`
* `UseNextSanityBlurUpImageBuilderOptions`
* `UseNextSanityImageBuilder`
* `UseNextSanityImageBuilderOptions`
* `UseNextSanityImageDimensions`
