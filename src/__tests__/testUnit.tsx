import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'

import WebActivityVisualizationPlugin from '../main'
import { Preview } from '../components/Preview'
import { View } from '../components/View'

function makeControls() {
  return {
    onPlay:  vi.fn().mockReturnValue(() => {}),
    onPause: vi.fn().mockReturnValue(() => {}),
    onSeek:  vi.fn().mockReturnValue(() => {}),
    onSync:  vi.fn().mockReturnValue(() => {}),
  }
}

function makeContext(filePath = '/test/web_activity_map.json') {
  return { filePath, captureStartTimestamp: 1000, fileCaptureStartTimestamp: 0, pauseIntervals: [] as [number, number][] }
}

const KS_EVENT = { browser: 'Chrome', pageUrl: 'https://x.com', pageTitle: 'X', keyValue: 'a', captureTimestamp: 1.5 }
const MC_EVENT = { browser: 'Chrome', pageUrl: 'https://x.com', pageTitle: 'X', xPage: 10, yPage: 20, xClient: 10, yClient: 20, xScreen: 10, yScreen: 20, button: 0, captureTimestamp: 1.5 }
const TAB_EVENT = { browser: 'Chrome', tabUrl: 'https://x.com', tabTitle: 'X', actionType: 'open', tabIndex: 0, tabId: 1, windowId: 1, captureTimestamp: 1.5 }
const SAMPLE_MAP = {
  keystrokes:  '/test/keystrokes.json',
  mouseClicks: '/test/mouseClicks.json',
}

function mockFetchMap(map: Record<string, string>, arrays: Record<string, unknown[]> = {}) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    const urlStr = String(url)
    if (urlStr.includes('web_activity_map')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(map) })
    }
    for (const [key, path] of Object.entries(map)) {
      if (urlStr.includes(path.replace(/\\/g, '/'))) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(arrays[key] ?? []) })
      }
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  })
}

function mockFetchError() {
  global.fetch = vi.fn().mockResolvedValue({ ok: false, json: vi.fn() } as any)
}

describe('WebActivityVisualizationPlugin', () => {
  let plugin: WebActivityVisualizationPlugin

  beforeEach(() => { plugin = new WebActivityVisualizationPlugin() })

  it('instance', () => {
    expect(plugin).toBeDefined()
  })

  it('extensions json', () => {
    expect(plugin.validExtensions()).toContain('json')
  })

  it('descriptor null false', () => {
    expect(plugin.validateCaptureDescriptor(null)).toBe(false)
  })

  it('descriptor web_activity_map', () => {
    expect(plugin.validateCaptureDescriptor({ format: 'web_activity_map' })).toBe(true)
  })

  it('descriptor wrong format false', () => {
    expect(plugin.validateCaptureDescriptor({ format: 'audio' })).toBe(false)
  })

  it('descriptor empty false', () => {
    expect(plugin.validateCaptureDescriptor({})).toBe(false)
  })

  it('getView', () => {
    mockFetchMap({})
    const el = plugin.getView({ controls: makeControls(), context: makeContext(), settings: {} } as any)
    expect(el).not.toBeNull()
  })

  it('getPreview', () => {
    expect(plugin.getPreview()).not.toBeNull()
  })
})

describe('Preview', () => {
  it('renders', () => {
    const { container } = render(<Preview />)
    expect(container.firstChild).not.toBeNull()
  })

  it('6 tab labels', () => {
    const { container } = render(<Preview />)
    const tabs = container.querySelectorAll('[style*="border"]')
    expect(tabs.length).toBeGreaterThanOrEqual(6)
  })

  it('preview title', () => {
    const { container } = render(<Preview />)
    expect(container.textContent).toContain('preview.title')
  })

  it('preview description', () => {
    const { container } = render(<Preview />)
    expect(container.textContent).toContain('preview.description')
  })

  it('tab element', () => {
    const { container } = render(<Preview />)
    const divs = container.querySelectorAll('div > div > div')
    expect(divs.length).toBeGreaterThanOrEqual(1)
  })
})

describe('View', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('renders', async () => {
    mockFetchMap({})
    const { container } = await act(async () =>
      render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('loading state', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    const { getByText } = render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    expect(getByText('loading')).not.toBeNull()
  })

  it('tab bar', async () => {
    mockFetchMap(SAMPLE_MAP)
    const { container } = await act(async () =>
      render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(6)
  })

  it('fetch error not ok', async () => {
    mockFetchError()
    const { container } = await act(async () =>
      render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    )
    expect(container.textContent).toContain('Failed to load map file')
  })

  it('fetch error throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('connection refused'))
    const { container } = await act(async () =>
      render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    )
    expect(container.textContent).toContain('connection refused')
  })

  it('keystrokes tab default', async () => {
    mockFetchMap(SAMPLE_MAP, { keystrokes: [KS_EVENT] })
    const { container } = await act(async () =>
      render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    )
    expect(container.textContent).toContain('tab.keystrokes')
  })

  it('mouseClicks tab', async () => {
    mockFetchMap(SAMPLE_MAP, { keystrokes: [KS_EVENT], mouseClicks: [MC_EVENT] })
    const { container } = await act(async () =>
      render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    )
    const buttons = container.querySelectorAll('button')
    await act(async () => { fireEvent.click(buttons[1]) })
    expect(container.textContent).toContain('tab.mouseClicks')
  })

  it('play handler', async () => {
    mockFetchMap(SAMPLE_MAP)
    const controls = makeControls()
    await act(async () => render(<View controls={controls} context={makeContext()} settings={{}} />))
    expect(controls.onPlay).toHaveBeenCalled()
  })

  it('pause handler', async () => {
    mockFetchMap(SAMPLE_MAP)
    const controls = makeControls()
    await act(async () => render(<View controls={controls} context={makeContext()} settings={{}} />))
    expect(controls.onPause).toHaveBeenCalled()
  })

  it('seek handler', async () => {
    mockFetchMap(SAMPLE_MAP)
    const controls = makeControls()
    await act(async () => render(<View controls={controls} context={makeContext()} settings={{}} />))
    expect(controls.onSeek).toHaveBeenCalled()
  })

  it('sync handler', async () => {
    mockFetchMap(SAMPLE_MAP)
    const controls = makeControls()
    await act(async () => render(<View controls={controls} context={makeContext()} settings={{}} />))
    expect(controls.onSync).toHaveBeenCalled()
  })

  it('cleanup unmount', async () => {
    mockFetchMap(SAMPLE_MAP)
    const unsub = vi.fn()
    const controls = {
      onPlay:  vi.fn().mockReturnValue(unsub),
      onPause: vi.fn().mockReturnValue(unsub),
      onSeek:  vi.fn().mockReturnValue(unsub),
      onSync:  vi.fn().mockReturnValue(unsub),
    }
    let unmount!: () => void
    await act(async () => { ({ unmount } = render(<View controls={controls} context={makeContext()} settings={{}} />)) })
    act(() => { unmount() })
    expect(unsub).toHaveBeenCalled()
  })

  it('future events filtered', async () => {
    const ks1 = { ...KS_EVENT, captureTimestamp: 0.3 }
    const ks2 = { ...KS_EVENT, captureTimestamp: 0.8 }
    mockFetchMap(
      { keystrokes: '/test/keystrokes.json' },
      { keystrokes: [ks1, ks2] }
    )
    let seekCb: ((ts: number) => void) | undefined
    const controls = {
      onPlay:  vi.fn().mockReturnValue(() => {}),
      onPause: vi.fn().mockReturnValue(() => {}),
      onSeek:  vi.fn().mockImplementation((cb) => { seekCb = cb; return () => {} }),
      onSync:  vi.fn().mockReturnValue(() => {}),
    }
    const ctx = { filePath: '/test/web_activity_map.json', captureStartTimestamp: 0, fileCaptureStartTimestamp: 0, pauseIntervals: [] as [number, number][] }
    const { container } = await act(async () =>
      render(<View controls={controls} context={ctx as any} settings={{}} />)
    )
    await act(async () => { seekCb?.(0) })
    expect(container.querySelector('td[colspan]')).not.toBeNull()
  })

  it('empty row no events', async () => {
    const futureKs = { ...KS_EVENT, captureTimestamp: 9999 }
    mockFetchMap(
      { keystrokes: '/test/keystrokes.json' },
      { keystrokes: [futureKs] }
    )
    let seekCb: ((ts: number) => void) | undefined
    const controls = {
      onPlay:  vi.fn().mockReturnValue(() => {}),
      onPause: vi.fn().mockReturnValue(() => {}),
      onSeek:  vi.fn().mockImplementation((cb) => { seekCb = cb; return () => {} }),
      onSync:  vi.fn().mockReturnValue(() => {}),
    }
    const { container } = await act(async () =>
      render(<View controls={controls} context={makeContext()} settings={{}} />)
    )
    await act(async () => { seekCb?.(0) })
    expect(container.querySelector('td[colspan]')).not.toBeNull()
  })

  it('buttonLabel left click', async () => {
    const leftClick = { ...MC_EVENT, button: 0, captureTimestamp: 0.5 }
    mockFetchMap(
      { mouseClicks: '/test/mouseClicks.json' },
      { mouseClicks: [leftClick] }
    )
    let seekCb: ((ts: number) => void) | undefined
    const controls = {
      onPlay:  vi.fn().mockReturnValue(() => {}),
      onPause: vi.fn().mockReturnValue(() => {}),
      onSeek:  vi.fn().mockImplementation((cb) => { seekCb = cb; return () => {} }),
      onSync:  vi.fn().mockReturnValue(() => {}),
    }
    const { container } = await act(async () =>
      render(<View controls={controls} context={makeContext()} settings={{}} />)
    )
    const buttons = container.querySelectorAll('button')
    await act(async () => { fireEvent.click(buttons[1]) })
    await act(async () => { seekCb?.(2000) })
    expect(container.textContent).toContain('leftMouseClickValue')
  })

  it('buttonLabel right click', async () => {
    const rightClick = { ...MC_EVENT, button: 2, captureTimestamp: 0.5 }
    mockFetchMap(
      { mouseClicks: '/test/mouseClicks.json' },
      { mouseClicks: [rightClick] }
    )
    let seekCb: ((ts: number) => void) | undefined
    const controls = {
      onPlay:  vi.fn().mockReturnValue(() => {}),
      onPause: vi.fn().mockReturnValue(() => {}),
      onSeek:  vi.fn().mockImplementation((cb) => { seekCb = cb; return () => {} }),
      onSync:  vi.fn().mockReturnValue(() => {}),
    }
    const { container } = await act(async () =>
      render(<View controls={controls} context={makeContext()} settings={{}} />)
    )
    const buttons = container.querySelectorAll('button')
    await act(async () => { fireEvent.click(buttons[1]) })
    await act(async () => { seekCb?.(2000) })
    expect(container.textContent).toContain('rightMouseClickValue')
  })

  it('tabs tab', async () => {
    mockFetchMap(
      { tabs: '/test/tabs.json' },
      { tabs: [TAB_EVENT] }
    )
    let seekCb: ((ts: number) => void) | undefined
    const controls = {
      onPlay:  vi.fn().mockReturnValue(() => {}),
      onPause: vi.fn().mockReturnValue(() => {}),
      onSeek:  vi.fn().mockImplementation((cb) => { seekCb = cb; return () => {} }),
      onSync:  vi.fn().mockReturnValue(() => {}),
    }
    const { container } = await act(async () =>
      render(<View controls={controls} context={makeContext()} settings={{}} />)
    )
    const buttons = container.querySelectorAll('button')
    await act(async () => { fireEvent.click(buttons[5]) })
    await act(async () => { seekCb?.(2000) })
    expect(container.textContent).toContain('https://x.com')
  })

  it('missing event file', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('web_activity_map')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ keystrokes: '/missing.json' }) })
      }
      return Promise.resolve({ ok: false, json: vi.fn() })
    })
    const { container } = await act(async () =>
      render(<View controls={makeControls()} context={makeContext()} settings={{}} />)
    )
    expect(container.querySelector('td[colspan]')).not.toBeNull()
  })
})
