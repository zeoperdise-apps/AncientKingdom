package net.ark.ancientkingdom;

import java.io.IOException;

import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;

public class DungeonWall {
	/// 壁画像名
	private static final String IMAGE_NAME = "/wall.png";
	
	/// 壁サイズ(X軸-中央)
	private static final int WALL_CENTOR_SIZE_X = 84;
	
	/// 壁サイズ(X軸-両脇)
	private static final int WALL_SIDE_SIZE_X = 48;
	
	/// 壁サイズ(X軸-両端)
	private static final int WALL_EXTREMELY_SIDE_SIZE_X = 30;
	
	/// 壁サイズ(Y軸)
	private static final int WALL_SIZE_Y = 160;
	
	/// 壁画像(最左)
	private Image imageExtremelyLeft[] = new Image[4];
	
	/// 壁画像(左)
	private Image imageLeft[] = new Image[4];
	
	/// 壁画像(中央)
	private Image imageCentor[] = new Image[4];
	
	/// 壁画像(右)
	private Image imageRight[] = new Image[4];
	
	/// 壁画像(最右)
	private Image imageExtremelyRight[] = new Image[4];
	
	/// 描画用作業スクリーン
	private Image drawWorkImage[] = new Image[5];
	
	
	/**
	 * デフォルトコンストラクタ
	 */
	public DungeonWall() {
		// 元画像の読込
		try {
			Image imageOriginal = null;
			
			imageOriginal = Image.createImage(IMAGE_NAME);
			
			separateImage(imageOriginal);
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}
	
	/**
	 * 現在地からダンジョン壁を描画する。
	 * @param gra グラフィックインスタンス
	 * @param map マップ情報
	 * @param currentPosition 現在地
	 * @param direction 向き情報
	 */
	public void draw(Graphics gra, byte[][] map, Position currentPosition, int direction) {
		int x = currentPosition.getX();
		int y = currentPosition.getY();
		
		// 描画用作業スクリーン初期化
		drawWorkImage[0] = imageExtremelyLeft[0];
		drawWorkImage[1] = imageLeft[0];
		drawWorkImage[2] = imageCentor[0];
		drawWorkImage[3] = imageRight[0];
		drawWorkImage[4] = imageExtremelyRight[0];
		
		
		switch (direction) {
		case Literal.NORTH:
			// System.out.println("NORTH");
			if (x-1>=0 && y-1>=0) {
				if ((map[x-1][y-1]&Literal.WEST)>0) {
					drawWorkImage[0] = imageExtremelyLeft[2];
				}
				if ((map[x-1][y-1]&Literal.NORTH)>0) {
					drawWorkImage[1] = imageLeft[2];
				}
			}
			if (x+1<map.length && y-1>=0) {
				if ((map[x+1][y-1]&Literal.EAST)>0) {
					drawWorkImage[4] = imageExtremelyRight[2];
				}
				if ((map[x+1][y-1]&Literal.NORTH)>0) {
					drawWorkImage[3] = imageRight[2];
				}
			}
			if (y-1>=0) {
				if ((map[x][y-1]&Literal.WEST)>0) {
					drawWorkImage[1] = imageLeft[1];
				}
				if ((map[x][y-1]&Literal.NORTH)>0) {
					drawWorkImage[2] = imageCentor[2];
				}
				if ((map[x][y-1]&Literal.EAST)>0) {
					drawWorkImage[3] = imageRight[1];
				}
			}

			if (x-1>=0) {
				if ((map[x-1][y]&Literal.NORTH)>0) {
					drawWorkImage[0] = imageExtremelyLeft[3];
				}
			}
			if (x+1<map.length) {
				if ((map[x+1][y]&Literal.NORTH)>0) {
					drawWorkImage[4] = imageExtremelyRight[3];
				}
			}
			if (true) {
				if ((map[x][y]&Literal.WEST)>0) {
					drawWorkImage[0] = imageExtremelyLeft[1];
				}
				if ((map[x][y]&Literal.NORTH)>0) {
					drawWorkImage[1] = imageLeft[3];
					drawWorkImage[2] = imageCentor[3];
					drawWorkImage[3] = imageRight[3];
				}
				if ((map[x][y]&Literal.EAST)>0) {
					drawWorkImage[4] = imageExtremelyRight[1];
				}
			}
			break;
			
		case Literal.EAST:
			// System.out.println("EAST");
			if (x+1<map.length && y-1>=0) {
				if ((map[x+1][y-1]&Literal.NORTH)>0) {
					drawWorkImage[0] = imageExtremelyLeft[2];
				}
				if ((map[x+1][y-1]&Literal.EAST)>0) {
					drawWorkImage[1] = imageLeft[2];
				}
			}
			if (x+1<map.length && y+1<map[x+1].length) {
				if ((map[x+1][y+1]&Literal.SOUTH)>0) {
					drawWorkImage[4] = imageExtremelyRight[2];
				}
				if ((map[x+1][y+1]&Literal.EAST)>0) {
					drawWorkImage[3] = imageRight[2];
				}
			}
			if (x+1<map.length) {
				if ((map[x+1][y]&Literal.NORTH)>0) {
					drawWorkImage[1] = imageLeft[1];
				}
				if ((map[x+1][y]&Literal.EAST)>0) {
					drawWorkImage[2] = imageCentor[2];
				}
				if ((map[x+1][y]&Literal.SOUTH)>0) {
					drawWorkImage[3] = imageRight[1];
				}
			}

			if (y-1>=0) {
				if ((map[x][y-1]&Literal.EAST)>0) {
					drawWorkImage[0] = imageExtremelyLeft[3];
				}
			}
			if (y+1<map[x].length) {
				if ((map[x][y+1]&Literal.EAST)>0) {
					drawWorkImage[4] = imageExtremelyRight[3];
				}
			}
			if (true) {
				if ((map[x][y]&Literal.NORTH)>0) {
					drawWorkImage[0] = imageExtremelyLeft[1];
				}
				if ((map[x][y]&Literal.EAST)>0) {
					drawWorkImage[1] = imageLeft[3];
					drawWorkImage[2] = imageCentor[3];
					drawWorkImage[3] = imageRight[3];
				}
				if ((map[x][y]&Literal.SOUTH)>0) {
					drawWorkImage[4] = imageExtremelyRight[1];
				}
			}
			break;
			
		case Literal.SOUTH:
			// System.out.println("SOUTH");
			if (x+1<map.length && y+1<map[x+1].length) {
				if ((map[x+1][y+1]&Literal.EAST)>0) {
					drawWorkImage[0] = imageExtremelyLeft[2];
				}
				if ((map[x+1][y+1]&Literal.SOUTH)>0) {
					drawWorkImage[1] = imageLeft[2];
				}
			}
			if (x-1>=0 && y+1<map[x-1].length) {
				if ((map[x-1][y+1]&Literal.WEST)>0) {
					drawWorkImage[4] = imageExtremelyRight[2];
				}
				if ((map[x-1][y+1]&Literal.SOUTH)>0) {
					drawWorkImage[3] = imageRight[2];
				}
			}
			if (y+1<map[x].length) {
				if ((map[x][y+1]&Literal.EAST)>0) {
					drawWorkImage[1] = imageLeft[1];
				}
				if ((map[x][y+1]&Literal.SOUTH)>0) {
					drawWorkImage[2] = imageCentor[2];
				}
				if ((map[x][y+1]&Literal.WEST)>0) {
					drawWorkImage[3] = imageRight[1];
				}
			}

			if (x+1<map.length) {
				if ((map[x+1][y]&Literal.SOUTH)>0) {
					drawWorkImage[0] = imageExtremelyLeft[3];
				}
			}
			if (x-1>=0) {
				if ((map[x-1][y]&Literal.SOUTH)>0) {
					drawWorkImage[4] = imageExtremelyRight[3];
				}
			}
			if (true) {
				if ((map[x][y]&Literal.EAST)>0) {
					drawWorkImage[0] = imageExtremelyLeft[1];
				}
				if ((map[x][y]&Literal.SOUTH)>0) {
					drawWorkImage[1] = imageLeft[3];
					drawWorkImage[2] = imageCentor[3];
					drawWorkImage[3] = imageRight[3];
				}
				if ((map[x][y]&Literal.WEST)>0) {
					drawWorkImage[4] = imageExtremelyRight[1];
				}
			}
			break;
			
		case Literal.WEST:
			// System.out.println("WEST");
			if (x-1>=0 && y+1<map[x-1].length) {
				if ((map[x-1][y+1]&Literal.SOUTH)>0) {
					drawWorkImage[0] = imageExtremelyLeft[2];
				}
				if ((map[x-1][y+1]&Literal.WEST)>0) {
					drawWorkImage[1] = imageLeft[2];
				}
			}
			if (x-1>=0 && y-1>=0) {
				if ((map[x-1][y-1]&Literal.NORTH)>0) {
					drawWorkImage[4] = imageExtremelyRight[2];
				}
				if ((map[x-1][y-1]&Literal.WEST)>0) {
					drawWorkImage[3] = imageRight[2];
				}
			}
			if (x-1>=0) {
				if ((map[x-1][y]&Literal.SOUTH)>0) {
					drawWorkImage[1] = imageLeft[1];
				}
				if ((map[x-1][y]&Literal.WEST)>0) {
					drawWorkImage[2] = imageCentor[2];
				}
				if ((map[x-1][y]&Literal.NORTH)>0) {
					drawWorkImage[3] = imageRight[1];
				}
			}

			if (y+1<map[x].length) {
				if ((map[x][y+1]&Literal.WEST)>0) {
					drawWorkImage[0] = imageExtremelyLeft[3];
				}
			}
			if (y-1>=0) {
				if ((map[x][y-1]&Literal.WEST)>0) {
					drawWorkImage[4] = imageExtremelyRight[3];
				}
			}
			if (true) {
				if ((map[x][y]&Literal.SOUTH)>0) {
					drawWorkImage[0] = imageExtremelyLeft[1];
				}
				if ((map[x][y]&Literal.WEST)>0) {
					drawWorkImage[1] = imageLeft[3];
					drawWorkImage[2] = imageCentor[3];
					drawWorkImage[3] = imageRight[3];
				}
				if ((map[x][y]&Literal.NORTH)>0) {
					drawWorkImage[4] = imageExtremelyRight[1];
				}
			}
			break;
		}
		
		int currentX = 0;
		for (int i=0; i<drawWorkImage.length; i++) {
			gra.drawImage(drawWorkImage[i], currentX, 0, Graphics.TOP|Graphics.LEFT);
			currentX += drawWorkImage[i].getWidth();
		}
	}
	
	/**
	 * 壁画像をパーツ単位に分割する。
	 * @param imageOriginal 元画像
	 */
	private void separateImage(Image imageOriginal) {
		int x = 0;
		
		// 最左の画像作成
		for (int i=0; i<imageExtremelyLeft.length; i++) {
			imageExtremelyLeft[i] = Image.createImage(WALL_EXTREMELY_SIDE_SIZE_X, WALL_SIZE_Y);
			imageExtremelyLeft[i].getGraphics().drawImage(imageOriginal, -x, -WALL_SIZE_Y*i, Graphics.TOP|Graphics.LEFT);
		}
		
		x += WALL_EXTREMELY_SIDE_SIZE_X;
		
		// 左の画像作成
		for (int i=0; i<imageLeft.length; i++) {
			imageLeft[i] = Image.createImage(WALL_SIDE_SIZE_X, WALL_SIZE_Y);
			imageLeft[i].getGraphics().drawImage(imageOriginal, -x, -WALL_SIZE_Y*i, Graphics.TOP|Graphics.LEFT);
		}
		
		x += WALL_SIDE_SIZE_X;
		
		// 中央の画像作成
		for (int i=0; i<imageCentor.length; i++) {
			imageCentor[i] = Image.createImage(WALL_CENTOR_SIZE_X, WALL_SIZE_Y);
			imageCentor[i].getGraphics().drawImage(imageOriginal, -x, -WALL_SIZE_Y*i, Graphics.TOP|Graphics.LEFT);
		}
		
		x += WALL_CENTOR_SIZE_X;
		
		// 右の画像作成
		for (int i=0; i<imageRight.length; i++) {
			imageRight[i] = Image.createImage(WALL_SIDE_SIZE_X, WALL_SIZE_Y);
			imageRight[i].getGraphics().drawImage(imageOriginal, -x, -WALL_SIZE_Y*i, Graphics.TOP|Graphics.LEFT);
		}
		
		x += WALL_SIDE_SIZE_X;
		
		// 最左の画像作成
		for (int i=0; i<imageExtremelyRight.length; i++) {
			imageExtremelyRight[i] = Image.createImage(WALL_EXTREMELY_SIDE_SIZE_X, WALL_SIZE_Y);
			imageExtremelyRight[i].getGraphics().drawImage(imageOriginal, -x, -WALL_SIZE_Y*i, Graphics.TOP|Graphics.LEFT);
		}
		
		
		/*
		// 以下デバッグ用
		x = 0;
		
		// 最左の画像作成
		for (int i=0; i<imageExtremelyLeft.length; i++) {
			Global.graphics.drawImage(imageExtremelyLeft[i], x, 0, Graphics.TOP|Graphics.LEFT);
			Global.canvas.flushGraphics();
			try{Thread.sleep(1000);}catch(Exception e){}
		}
		
		x += WALL_EXTREMELY_SIDE_SIZE_X;
		
		// 左の画像作成
		for (int i=0; i<imageLeft.length; i++) {
			Global.graphics.drawImage(imageLeft[i], x, 0, Graphics.TOP|Graphics.LEFT);
			Global.canvas.flushGraphics();
			try{Thread.sleep(1000);}catch(Exception e){}
		}
		
		x += WALL_SIDE_SIZE_X;
		
		// 中央の画像作成
		for (int i=0; i<imageCentor.length; i++) {
			Global.graphics.drawImage(imageCentor[i], x, 0, Graphics.TOP|Graphics.LEFT);
			Global.canvas.flushGraphics();
			try{Thread.sleep(1000);}catch(Exception e){}
		}
		
		x += WALL_CENTOR_SIZE_X;
		
		// 右の画像作成
		for (int i=0; i<imageRight.length; i++) {
			Global.graphics.drawImage(imageRight[i], x, 0, Graphics.TOP|Graphics.LEFT);
			Global.canvas.flushGraphics();
			try{Thread.sleep(1000);}catch(Exception e){}
		}
		
		x += WALL_SIDE_SIZE_X;
		
		// 最左の画像作成
		for (int i=0; i<imageExtremelyRight.length; i++) {
			Global.graphics.drawImage(imageExtremelyRight[i], x, 0, Graphics.TOP|Graphics.LEFT);
			Global.canvas.flushGraphics();
			try{Thread.sleep(1000);}catch(Exception e){}
		}
		*/
	}
}
