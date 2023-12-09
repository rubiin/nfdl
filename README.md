# helper-fns

> JavaScript Utilities


<p align="center">
<a href="https://github.com/rubiin/js-utils/actions/workflows/release.yml"><img src="https://github.com/rubiin/js-utils/actions/workflows/release.yml/badge.svg" alt="Build" /></a>
<a href="https://img.shields.io/npm/v/helper-fns"><img src="https://img.shields.io/npm/v/helper-fns" alt="NPM Version" /></a>
<a href="https://img.shields.io/npm/l/helper-fns"><img src="https://img.shields.io/npm/l/helper-fns" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/helper-fns"><img src="https://img.shields.io/npm/dm/helper-fns" alt="NPM Downloads" /></a>


# INSTALLAION

```
npm i helper-fns
yarn add helper-fns

```

Common JavaScript packages and utilities used across my projects.

# isEmpty

Checks if the a value is an empty object/collection, has no enumerable properties or is any type that is not considered a collection.

```js
isEmpty([]) // true
isEmpty({}) // true
isEmpty('') // true
isEmpty([1, 2]) // false
isEmpty({ a: 1, b: 2 }) // false
isEmpty('text') // false
isEmpty(123) // false - type is not considered a collection
isEmpty(true) // false
```

# orderedToken

Generates token based on user defined format

```js
orderedToken('RU-XXXXX') // RU-16891
```


# pick

Picks the key-value pairs corresponding to the given keys from an object.

```js
pick({ a: 1, b: '2', c: 3 }, ['a', 'c']) // { 'a': 1, 'c': 3 }
```

# omit

Omits the key-value pairs corresponding to the given keys from an object.

```js
omit({ a: 1, b: '2', c: 3 }, ['b']) // { 'a': 1, 'c': 3 }
```

# sumOfAnArray

Calculates the sum of two or more numbers/arrays.

```js
sumOfAnArray(1, 2, 3, 4) // 10
```

# pipeFunctions

Performs left-to-right function composition.

```js
const add5 = x => x + 5
const multiply = (x, y) => x * y
const multiplyAndAdd5 = pipeFunctions(multiply, add5)
multiplyAndAdd5(5, 2) // 15
```

# renameKeys

Replaces the names of multiple object keys with the values provided.

```js
const obj = { name: 'Bobo', job: 'Front-End Master', shoeSize: 100 }
renameKeys({ name: 'firstName', job: 'passion' }, obj)
// { firstName: 'Bobo', passion: 'Front-End Master', shoeSize: 100 }
```

# objectArrayToArray

Creates an array of key-value pair arrays from an object.

```js
objectToEntries({ a: 1, b: 2 }) // [ ['a', 1], ['b', 2] ]
```

# clone

Creates a shallow clone of value.

```js
const objects = [{ a: 1 }, { b: 2 }]

const shallow = clone(objects)
console.log(shallow[0] === objects[0])
```

# difference

Calculates the difference between two arrays, without filtering duplicate values.

```js
difference([1, 2, 3, 3], [1, 2, 4]) // [3, 3]
```

# union

Returns every element that exists in any of the two arrays at least once.

```js
union([1, 2, 3], [4, 3, 2]) // [1, 2, 3, 4]
```

# isDate

Checks if gicen string is date

```js
console.log(isDate('not-date'))
// false

console.log(isDate('2019-01-10'))
// true
```

# groupBy

Groups the elements of an array based on the given function.

```js
groupBy([6.1, 4.2, 6.3], Math.floor) // {4: [4.2], 6: [6.1, 6.3]}
groupBy(['one', 'two', 'three'], 'length') // {3: ['one', 'two'], 5: ['three']}
```

# orderBy

Sorts an array of objects, ordered by properties and orders.

```js
const users = [
  { name: 'fred', age: 48 },
  { name: 'barney', age: 36 },
  { name: 'fred', age: 40 },
]
orderBy(users, ['name', 'age'], ['asc', 'desc'])
// [{name: 'barney', age: 36}, {name: 'fred', age: 48}, {name: 'fred', age: 40}]
orderBy(users, ['name', 'age'])
// [{name: 'barney', age: 36}, {name: 'fred', age: 40}, {name: 'fred', age: 48}]
```

# randomNumber

Generates random number of between a min number and a max number.


```js
console.log(randomNumber(0, 6)) // integer between 0 and 6
// 5
```


# enumToString

Generates random number of between a min number and a max number.

```ts
export enum AppRoles {
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN'
}

console.log(enumToString(AppRoles))
// ["AUTHOR", "ADMIN"]
```

# randomString

Generates random string of giben length

```js
console.log(randomString(6))
// a1t4ry
```

# strAfter

Get string after a substring

```js
strAfter('pineapple', 'pine') // apple
```

# strBefore

Get string before a substring

```js
strBefore('pineapple', 'apple') // pine
```


# isObject

Checks if the passed value is an object or not.

```js
isObject([1, 2, 3, 4]) // true
isObject([]) // true
isObject(['Hello!']) // true
isObject({ a: 1 }) // true
isObject({}) // true
isObject(true) // false
```

# fixedDecimal

Get a number after truncating it from the decimal point. No round off is done

```js
fixedDecimal(3.141525, 3) // 3.141
```

# generateRandomString

Get a random string of defined length

```js
generateRandomString(6) // fd84bg
```

# slugify

Generate a slug from a string

```js
slugify('i love javascript') // i-love-javascript
```

# capitalizeEveryWord

```js
capitalizeEveryWord('hello world!') // 'Hello World!'
```

# throttle

```js
window.addEventListener(
  'resize',
  throttle((evt) => {
    console.log(window.innerWidth)
    console.log(window.innerHeight)
  }, 250),
) // Will log the window dimensions at most every 250ms
```

# unescapeHTML

```js
unescapeHTML('&lt;a href=&quot;#&quot;&gt;Me &amp; you&lt;/a&gt;')
// '<a href="#">Me & you</a>'
```

# timeTaken

```js
timeTaken(() => 2 ** 10) // 1024, (logged): timeTaken: 0.02099609375ms
```

# formatDuration

```js
formatDuration(1001) // '1 second, 1 millisecond'
formatDuration(34325055574)
// '397 days, 6 hours, 44 minutes, 15 seconds, 574 milliseconds'
```

# template

```js
template('Hello, {{name}}!', { name: 'world' })
// => Hello, world!

template('Howdy, {{0}}! {{1}}', ['partner', '🤠'])
// => Howdy, partner! 🤠

template('foo: "{{foo}}"; bar: "{{bar}}";', { foo: 123 })
// => foo: "123"; bar: "";

template(
	`
  Name: {{name.last}}, {{name.first}}
  Location: {{address.city}} ({{address.country}})
  Hobbies: {{hobbies.0}}, {{hobbies.1}}, {{hobbies.2}}
`,
	{
	  name: {
	    first: 'Luke',
	    last: 'Edwards',
	  },
	  address: {
	    city: 'Los Angeles',
	    country: 'USA',
	  },
	  hobbies: ['eat', 'sleep', 'repeat'],
	},
)
```

# encrypt and decrypt

```
  console.log(encrypt('hello','32 bytes hex key','16 bytes hex iv'))
  // p5HX3eMlroLYJPhXr2zARg==

 console.log(decrypt('p5HX3eMlroLYJPhXr2zARg==','32 bytes hex key','16 bytes hex iv'))
// hello

```

## Contributing

Any types of contributions are welcome. Feel free to send pull requests or create issues.

## License

Licensed under [The MIT License](LICENSE).
