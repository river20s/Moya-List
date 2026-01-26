package com.moyalist.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TagRequestDto {
    
    private String name; // 태그명
    private String color; // 색상 HEX 코드
    
}