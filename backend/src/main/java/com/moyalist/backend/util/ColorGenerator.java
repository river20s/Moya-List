package com.moyalist.backend.util;

import java.util.Random;

public class ColorGenerator {

    private static final Random random = new Random();

    public static String generateRandomColor() {
        // H
        // S
        // L

        int h = random.nextInt(360);
        int s = 50 + random.nextInt(31);
        int l = 40 + random.nextInt(21);

        return hslToHex(h, s, l);
    }

    private static String hslToHex(int h, int s, int l) {
        // HSL -> RGB -> HEX
        // 1. 비율로 변환 (0~1 범위)
        double sRatio = s / 100.0;
        double lRatio = l / 100.0;

        // 2. 중간값 계산
        double c = (1 - Math.abs(2 * lRatio - 1)) * sRatio;  // 채도 계수
        double x = c * (1 - Math.abs((h / 60.0) % 2 - 1));   // 보조값
        double m = lRatio - c / 2;                            // 밝기 보정값

        // 3. 색상 구간에 따라 RGB 결정
        double r, g, b;
        if (h < 60) {
            r = c; g = x; b = 0;
        } else if (h < 120) {
            r = x; g = c; b = 0;
        } else if (h < 180) {
            r = 0; g = c; b = x;
        } else if (h < 240) {
            r = 0; g = x; b = c;
        } else if (h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        // 4. 0~255 범위로 변환
        int red = (int) Math.round((r + m) * 255);
        int green = (int) Math.round((g + m) * 255);
        int blue = (int) Math.round((b + m) * 255);

        // 5. HEX 문자열로 변환
        return String.format("#%02X%02X%02X", red, green, blue);

    }
}