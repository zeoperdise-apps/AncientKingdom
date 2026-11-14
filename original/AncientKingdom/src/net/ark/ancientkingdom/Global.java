package net.ark.ancientkingdom;

import java.util.Random;

import javax.microedition.lcdui.Graphics;

public class Global {
	/// 擬似乱数発生装置
	public static Random rand = null;
	
	/// デバッグ用 キャンバス公開 (一般には使うな！)
	public static AncientKingdomCanvas canvas = null;
	public static Graphics graphics = null;
	
	/// Music Player
	public static Music music = null;
	
	// スタティック値初期化
	static {
		rand = new Random(System.currentTimeMillis());
		music = new Music();
	}
}
