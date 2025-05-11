package com.TWOvALL.earthquake.util;

import java.util.Locale;

public class NormalizerUtil {

    public static String normalizePhoneNumber(String rawPhone) {
        if (rawPhone == null) return "N/A";

        String[] parts = rawPhone.split(",");
        StringBuilder normalized = new StringBuilder();

        for (String part : parts) {
            String digitsOnly = part.replaceAll("\\D", "");

            // Remove leading 90 or 0
            if (digitsOnly.startsWith("90")) {
                digitsOnly = digitsOnly.substring(2);
            } else if (digitsOnly.startsWith("0")) {
                digitsOnly = digitsOnly.substring(1);
            }

            // Take the last 10 digits
            if (digitsOnly.length() >= 10) {
                String first10 = digitsOnly.substring(0, 10);
                if (!normalized.isEmpty()) normalized.append(", ");
                normalized.append(first10);
            }
        }

        return !normalized.isEmpty() ? normalized.toString() : "N/A";
    }





    public static String normalizeText(String rawText) {
        if (rawText == null) return "N/A";
        return (rawText.replace(",", ""));
    }
}
