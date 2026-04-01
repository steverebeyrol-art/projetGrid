import * as THREE from 'three'

export function exportSTL(mesh) {
  // Collect all meshes from the scene
  const meshes = []
  if (mesh.isMesh) {
    meshes.push(mesh)
  } else {
    mesh.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)
      }
    })
  }

  // Calculate total triangles
  let totalTriangles = 0
  const geometries = meshes.map((m) => {
    const geo = m.geometry.clone()
    geo.applyMatrix4(m.matrixWorld)
    if (!geo.index) {
      totalTriangles += geo.attributes.position.count / 3
    } else {
      totalTriangles += geo.index.count / 3
    }
    return geo
  })

  // Binary STL format
  const headerBytes = 80
  const triangleBytes = 50
  const bufferLength = headerBytes + 4 + totalTriangles * triangleBytes
  const buffer = new ArrayBuffer(bufferLength)
  const view = new DataView(buffer)

  // Header (80 bytes)
  for (let i = 0; i < 80; i++) view.setUint8(i, 0)
  // Number of triangles
  view.setUint32(80, totalTriangles, true)

  let offset = 84
  const normal = new THREE.Vector3()
  const vA = new THREE.Vector3()
  const vB = new THREE.Vector3()
  const vC = new THREE.Vector3()

  for (const geo of geometries) {
    const pos = geo.attributes.position
    const idx = geo.index

    const triCount = idx ? idx.count / 3 : pos.count / 3

    for (let i = 0; i < triCount; i++) {
      let a, b, c
      if (idx) {
        a = idx.getX(i * 3)
        b = idx.getX(i * 3 + 1)
        c = idx.getX(i * 3 + 2)
      } else {
        a = i * 3
        b = i * 3 + 1
        c = i * 3 + 2
      }

      vA.fromBufferAttribute(pos, a)
      vB.fromBufferAttribute(pos, b)
      vC.fromBufferAttribute(pos, c)

      normal.crossVectors(
        vB.clone().sub(vA),
        vC.clone().sub(vA)
      ).normalize()

      // Normal
      view.setFloat32(offset, normal.x, true); offset += 4
      view.setFloat32(offset, normal.y, true); offset += 4
      view.setFloat32(offset, normal.z, true); offset += 4
      // Vertex A
      view.setFloat32(offset, vA.x, true); offset += 4
      view.setFloat32(offset, vA.y, true); offset += 4
      view.setFloat32(offset, vA.z, true); offset += 4
      // Vertex B
      view.setFloat32(offset, vB.x, true); offset += 4
      view.setFloat32(offset, vB.y, true); offset += 4
      view.setFloat32(offset, vB.z, true); offset += 4
      // Vertex C
      view.setFloat32(offset, vC.x, true); offset += 4
      view.setFloat32(offset, vC.y, true); offset += 4
      view.setFloat32(offset, vC.z, true); offset += 4
      // Attribute byte count
      view.setUint16(offset, 0, true); offset += 2
    }

    geo.dispose()
  }

  return buffer
}

export function downloadSTL(group, filename = 'gridfinity-model.stl') {
  const buffer = exportSTL(group)
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
