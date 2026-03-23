/**
 * Range 工具类型，用于生成从 N 到 M（包含 N 和 M）的数字字面量联合类型。
 * 采用从 0 开始计数的尾递归优化方式，能自然处理 N > M 的情况并返回 never。
 * 
 * @template N 起始数字字面量类型
 * @template M 结束数字字面量类型
 * @template T 内部使用的递归元组，用于通过长度进行计数，默认为空元组
 * @template IsInRange 内部标志，表示当前计数是否已到达 N，默认为 false
 * @template R 内部累加的结果类型，使用联合类型收集范围内的数字，默认为 never
 * 
 * @example
 * type A = Range<1, 3>; // 1 | 2 | 3
 * type B = Range<3, 3>; // 3
 * type C = Range<3, 1>; // never
 */
export type Range<
  N extends number,
  M extends number,
  T extends unknown[] = [],
  IsInRange extends boolean = false,
  R extends number = never
> = T['length'] extends M
  ? IsInRange extends true
  ? R | M
  : N extends M
  ? N
  : never
  : T['length'] extends N
  ? Range<N, M, [...T, unknown], true, T['length']>
  : IsInRange extends true
  ? Range<N, M, [...T, unknown], true, R | T['length']>
  : Range<N, M, [...T, unknown], false, R>;
