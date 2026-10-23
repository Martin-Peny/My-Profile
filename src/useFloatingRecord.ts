import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";

type Point = { x: number; y: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export function useFloatingRecord(
  buttonRef: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  onActivate: () => void,
) {
  const [point, setPoint] = useState<Point | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [dragging, setDragging] = useState(false);
  const [layoutRevision, refreshLayout] = useState(0);
  const moved = useRef(false);
  const suppressClick = useRef(false);
  const gesture = useRef<{ id: number; start: Point; origin: Point; dragged: boolean } | null>(null);

  function bounds() {
    const button = buttonRef.current!;
    const style = getComputedStyle(button);
    const size = button.getBoundingClientRect().width;
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    return {
      size,
      left: left + parseFloat(style.scrollMarginLeft),
      right: left + width - parseFloat(style.scrollMarginRight),
      top: top + parseFloat(style.scrollMarginTop),
      bottom: top + height - parseFloat(style.scrollMarginBottom),
    };
  }

  useLayoutEffect(() => {
    if (!buttonRef.current) return;
    const area = bounds();
    const initialTop = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 80) + 16;
    const next = moved.current && point
      ? { x: clamp(point.x, area.left, area.right - area.size), y: clamp(point.y, area.top, area.bottom - area.size) }
      : { x: area.left, y: clamp(initialTop, area.top, area.bottom - area.size) };
    if (!point || next.x !== point.x || next.y !== point.y) {
      setPoint(next);
      return;
    }
    if (!open || !panelRef.current) return;

    const panel = panelRef.current.getBoundingClientRect();
    // Keep navigation available while the playlist is open near the top of the page.
    const top = Math.max(area.top, (document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0) + 12);
    const width = panel.width;
    const gap = 12;
    let left: number;
    let panelTop: number;
    let maxHeight: number;
    if (area.right - (point.x + area.size + gap) >= width || point.x - gap - width >= area.left) {
      left = area.right - (point.x + area.size + gap) >= width ? point.x + area.size + gap : point.x - gap - width;
      maxHeight = Math.max(44, area.bottom - top);
      panelTop = clamp(point.y + area.size / 2 - panel.height / 2, top, area.bottom - Math.min(panel.height, maxHeight));
    } else {
      left = clamp(point.x + area.size / 2 - width / 2, area.left, area.right - width);
      const above = point.y - gap - top;
      const below = area.bottom - point.y - area.size - gap;
      const upwards = above >= below;
      maxHeight = Math.max(44, upwards ? above : below);
      panelTop = upwards ? point.y - gap - Math.min(panel.height, maxHeight) : point.y + area.size + gap;
      panelTop = clamp(panelTop, top, area.bottom - Math.min(panel.height, maxHeight));
    }
    const nextStyle = { left, top: panelTop, maxHeight };
    if (panelStyle.left !== left || panelStyle.top !== panelTop || panelStyle.maxHeight !== maxHeight) setPanelStyle(nextStyle);
  }, [point, panelStyle, open, layoutRevision, buttonRef, panelRef]);

  useEffect(() => {
    const refresh = () => refreshLayout(value => value + 1);
    const observer = new ResizeObserver(refresh);
    if (panelRef.current) observer.observe(panelRef.current);
    if (buttonRef.current) observer.observe(buttonRef.current);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, { passive: true });
    window.visualViewport?.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("scroll", refresh);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
      window.visualViewport?.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("scroll", refresh);
    };
  }, [buttonRef, panelRef]);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || !point) return;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: point, dragged: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    const dx = event.clientX - active.start.x;
    const dy = event.clientY - active.start.y;
    if (!active.dragged && Math.hypot(dx, dy) < 6) return;
    active.dragged = true;
    moved.current = true;
    suppressClick.current = true;
    setDragging(true);
    const area = bounds();
    setPoint({ x: clamp(active.origin.x + dx, area.left, area.right - area.size), y: clamp(active.origin.y + dy, area.top, area.bottom - area.size) });
  }

  function endGesture(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (active?.id !== event.pointerId) return;
    // Browsers can suppress a synthesized click immediately after a touch drag.
    // Activate a touch tap on release and ignore its later compatibility click.
    if (event.type === "pointerup" && event.pointerType === "touch" && !active.dragged) {
      event.preventDefault();
      suppressClick.current = true;
      onActivate();
    }
    gesture.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return {
    positionStyle: point ? { left: point.x, top: point.y } : undefined,
    panelStyle,
    dragging,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp: endGesture, onPointerCancel: endGesture, onLostPointerCapture: endGesture },
    allowClick: (keyboard: boolean) => keyboard || !suppressClick.current,
  };
}
