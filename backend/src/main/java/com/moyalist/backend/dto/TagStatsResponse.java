package com.moyalist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TagStatsResponse {

    private Long tagId;
    private String tagName;
    private Long count;




}