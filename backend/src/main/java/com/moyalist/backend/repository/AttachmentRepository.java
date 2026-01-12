package com.moyalist.backend.repository;

import com.moyalist.backend.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByQuestionId(Long questionId);
}