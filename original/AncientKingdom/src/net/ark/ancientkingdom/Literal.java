package net.ark.ancientkingdom;

import javax.microedition.lcdui.Font;

public class Literal {
	/// スクリーン横サイズ
	public static int CANVAS_WIDTH = 240;
	/// スクリーン縦サイズ
	public static int CANVAS_HEIGHT = 268;
	
	/// フォント(小)
	public static Font FONT_S = Font.getFont(Font.FACE_MONOSPACE , Font.STYLE_PLAIN, Font.SIZE_SMALL);
	/// フォント(中)
	public static Font FONT_M = Font.getFont(Font.FACE_MONOSPACE , Font.STYLE_PLAIN, Font.SIZE_MEDIUM);
	/// フォント(大)
	public static Font FONT_L = Font.getFont(Font.FACE_MONOSPACE , Font.STYLE_PLAIN, Font.SIZE_LARGE);
	
	/// 方角(北)
	public static final int NORTH = 0x1;
	/// 方角(東)
	public static final int EAST = 0x2;
	/// 方角(南)
	public static final int SOUTH = 0x4;
	/// 方角(西)
	public static final int WEST = 0x8;
	
	/// キー入力 UP
	public static final int KEY_UP = -1;
	/// キー入力 DOWN
	public static final int KEY_DOWN = -2;
	/// キー入力 LEFT
	public static final int KEY_LEFT = -3;
	/// キー入力 RIGHT
	public static final int KEY_RIGHT = -4;
	/// キー入力 CENTOR
	public static final int KEY_CENTOR = -5;
	
	/// イベント識別子 イベントなし
	public static final byte EVENT_NONE = 0;
	/// イベント識別子 下り階段
	public static final byte EVENT_DOWN = 1;
	/// イベント識別子 上り階段
	public static final byte EVENT_UP = 2;
	/// イベント識別子 下り階段の鍵
	public static final byte EVENT_DOWN_KEY = 3;
}
