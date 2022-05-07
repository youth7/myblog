

## `unwrap`系



|                        | `Option`的值为`None`时的返回策略                             | `Result`的值为`Err`时的返回策略                              |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `unwrap`               | 没有返回值，直接panic                                        | 类似`Option`，略                                             |
| `unwrap_or`            | 返回一个默认值。该默认值是调用`unwrap_or`时传参指定的        | 类似`Option`，略                                             |
| `unwrap_or_default`    | 返回一个默认值。该默认值是实现`Default`Trait时确定的         | 类似`Option`，略                                             |
| `unwrap_or_else`       | 返回一个默认值。该默认值是由传递给`unwrap_or_else`的闭包参数决定的 | 类似`Option`，略                                             |
| `unwrap_unchecked`     | 返回一个`None`,如果在`Some`上调用将会导致undefined behavior  | 类似`Option`，略                                             |
| `unwrap_err`           |                                                              | 返回`Err`对象的值，如果在`Ok`上调用将会导致panic，该方法**会检查**返回的对象是不是`Ok` |
| `unwrap_err_unchecked` |                                                              | 返回`Err`对象的值，如果在`Ok`上调用将会导致undefined behavior，因为该方法**不会检查**返回的对象是不是`Ok` |



## `expect`系

这个方法和unwrap相关方法类似



|              | `Option`的值为`None`时的返回策略                     | `Result`的值为`Err`时的返回策略                  |
| ------------ | ---------------------------------------------------- | ------------------------------------------------ |
| `expect`     | 没有返回值，直接panic，但是可以指定panic时的错误信息 | 类似`Option`，略                                 |
| `expect_err` |                                                      | 返回`Err`对象的值，如果在`Ok`上调用将会导致panic |

