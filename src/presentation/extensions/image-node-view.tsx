import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useCallback, useRef } from 'react';

type WrapMode = 'none' | 'left' | 'right';
type AlignMode = 'left' | 'center' | 'right';

const MIN_WIDTH = 60;
const MAX_WIDTH = 1000;

function clampWidth(width: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)));
}

/**
 * Image node view with drag-to-resize corner handles and text-wrap positioning.
 * Wrapping (float left/right) lets text flow around an image — a capability
 * Google Docs only exposes through its "Wrap text" mode; here it is a first-class
 * inline control.
 */
export function ImageNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{ startX: number; startWidth: number; ratio: number } | null>(null);

  const width = typeof node.attrs.width === 'number' ? node.attrs.width : null;
  const height = typeof node.attrs.height === 'number' ? node.attrs.height : null;
  const align = (node.attrs.align as AlignMode) ?? 'center';
  const wrap = (node.attrs.wrap as WrapMode) ?? 'none';
  const editable = editor.isEditable;

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const state = dragState.current;
      if (!state) return;
      const delta = event.clientX - state.startX;
      const next = clampWidth(state.startWidth + delta);
      updateAttributes({ width: next, height: Math.round(next * state.ratio) });
    },
    [updateAttributes],
  );

  const endDrag = useCallback(() => {
    dragState.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [onPointerMove]);

  const startDrag = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const img = imgRef.current;
      const currentWidth = width ?? img?.clientWidth ?? 320;
      const naturalRatio =
        img && img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 0.75;
      dragState.current = {
        startX: event.clientX,
        startWidth: currentWidth,
        ratio: naturalRatio,
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
    },
    [width, onPointerMove, endDrag],
  );

  const wrapperStyle: React.CSSProperties = {
    display: wrap === 'none' ? 'block' : 'inline-block',
    width: width ? `${width}px` : 'fit-content',
    maxWidth: '100%',
  };

  if (wrap === 'left') {
    wrapperStyle.float = 'left';
    wrapperStyle.margin = '0.25rem 1rem 0.5rem 0';
  } else if (wrap === 'right') {
    wrapperStyle.float = 'right';
    wrapperStyle.margin = '0.25rem 0 0.5rem 1rem';
  } else {
    wrapperStyle.marginTop = '0.5rem';
    wrapperStyle.marginBottom = '0.5rem';
    wrapperStyle.marginLeft = align === 'center' || align === 'right' ? 'auto' : '0';
    wrapperStyle.marginRight = align === 'center' || align === 'left' ? 'auto' : '0';
  }

  return (
    <NodeViewWrapper
      className={`gdocs-img${selected ? ' gdocs-img--selected' : ''} gdocs-img--wrap-${wrap}`}
      style={wrapperStyle}
      data-align={align}
      data-wrap={wrap}
      ref={containerRef}
    >
      <img
        ref={imgRef}
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ''}
        title={(node.attrs.title as string) ?? undefined}
        width={width ?? undefined}
        height={height ?? undefined}
        draggable={false}
        className="gdocs-img__el"
      />
      {editable && selected ? (
        <>
          <span className="gdocs-img__handle gdocs-img__handle--nw" onPointerDown={startDrag} />
          <span className="gdocs-img__handle gdocs-img__handle--ne" onPointerDown={startDrag} />
          <span className="gdocs-img__handle gdocs-img__handle--sw" onPointerDown={startDrag} />
          <span className="gdocs-img__handle gdocs-img__handle--se" onPointerDown={startDrag} />
        </>
      ) : null}
    </NodeViewWrapper>
  );
}
