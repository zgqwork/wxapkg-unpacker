const str = 'splitWxapkg'
const str1 = 'splitWxapk'
console.log(str, str)
console.log(str1.padEnd(str.length), str)

console.log('splitJs                    '.length)

const p = new Proxy(
  {},
  {
    get: () => console.log,
  }
)

p.f(1)
