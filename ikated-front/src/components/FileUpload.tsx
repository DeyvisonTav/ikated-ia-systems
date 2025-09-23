'use client'

import React, { useCallback, useState } from 'react'
import { Upload, X, File, Loader2 } from 'lucide-react'

interface UploadedFile {
  file: File
  id: string
  preview?: string
  extractedText?: string
  analyzing?: boolean
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  className?: string
}

export function FileUpload({
  onFilesUploaded,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.txt'],
  maxFiles = 5,
  className = ''
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      processFiles(selectedFiles)
    }
  }, [])

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      return acceptedTypes.includes(extension)
    })

    if (files.length + validFiles.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    const processedFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      analyzing: true
    }))

    const updatedFiles = [...files, ...processedFiles]
    setFiles(updatedFiles)
    onFilesUploaded(updatedFiles)

    // Simulate file analysis
    processedFiles.forEach(uploadedFile => {
      setTimeout(() => {
        setFiles(prev => prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, analyzing: false, extractedText: 'Texto extraído simulado do documento...' }
            : f
        ))
      }, 2000 + Math.random() * 2000)
    })
  }

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id)
    setFiles(updatedFiles)
    onFilesUploaded(updatedFiles)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragOver
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 bg-card'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Carregue seus documentos
              </h3>
              <p className="text-muted-foreground mb-2">
                Arraste e solte seus arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground">
                Suporte: {acceptedTypes.join(', ')} • Máximo {maxFiles} arquivos
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Arquivos Carregados</h4>
          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <File className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB
                    </p>

                    {uploadedFile.analyzing && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Loader2 className="w-3 h-3 text-primary animate-spin" />
                        <span className="text-xs text-primary">
                          Analisando documento...
                        </span>
                      </div>
                    )}

                    {uploadedFile.extractedText && !uploadedFile.analyzing && (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          Texto extraído com sucesso
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}