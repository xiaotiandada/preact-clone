export interface ComponentClass<P = {}> extends preact.ComponentClass<P> {
  _contextRef?: any

  // Override public contextType with internal PreactContext type
  contextType?: PreactContext
}

// Redefine ComponentType using our new internal FunctionComponent interface above
export type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>
