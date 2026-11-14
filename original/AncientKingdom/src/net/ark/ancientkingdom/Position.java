package net.ark.ancientkingdom;

/**
 * 位置座標.
 * @author TATU
 *
 */
public class Position {
	private int x = 0;
	private int y = 0;
	
	/**
	 * 指定された初期位置座標をもつインスタンスを生成する。
	 * @param x 初期X座標
	 * @param y 初期Y座標
	 */
	public Position(int x, int y) {
		this.x = x;
		this.y = y;
	}
	
	/**
	 * X座標を取得する。
	 * @return X座標
	 */
	public int getX() {
		return x;
	}

	/**
	 * X座標を設定する。
	 * @param x X座標
	 */
	public void setX(int x) {
		this.x = x;
	}
	
	/**
	 * X座標を変更する。
	 * @param dX 変更差分
	 */
	public void moveX(int dX) {
		this.x += dX;
	}

	/**
	 * Y座標を取得する。
	 * @return Y座標
	 */
	public int getY() {
		return y;
	}

	/**
	 * Y座標を設定する。
	 * @param y Y座標
	 */
	public void setY(int y) {
		this.y = y;
	}
	
	/**
	 * Y座標を変更する。
	 * @param dY 変更差分
	 */
	public void moveY(int dY) {
		this.y += dY;
	}
}
