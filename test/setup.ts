import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost/",
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const globalAny = globalThis as unknown as Record<string, unknown>;
globalAny.window = dom.window;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
globalAny.document = dom.window.document;
globalAny.HTMLElement = dom.window.HTMLElement;
globalAny.Element = dom.window.Element;
globalAny.Node = dom.window.Node;
globalAny.MouseEvent = dom.window.MouseEvent;
globalAny.KeyboardEvent = dom.window.KeyboardEvent;
globalAny.Event = dom.window.Event;
globalAny.ResizeObserver = ResizeObserverStub;
globalAny.IS_REACT_ACT_ENVIRONMENT = true;

export const scrollCalls: ScrollToOptions[] = [];

dom.window.HTMLElement.prototype.scrollTo = function scrollTo(options?: ScrollToOptions | number) {
  if (typeof options === "object" && options !== null) {
    scrollCalls.push(options);
  }
};

export { dom };
