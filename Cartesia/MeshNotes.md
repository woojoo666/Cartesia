Cartesia
	getTransform
	getAbsoluteTransform
	addChild
	draw

CustomCartesia
	transform

SimpleCartesia
	Position
	Pitch/Yaw/Roll
	Scale

TriangleMeshCartesia
	TriangleMesh

### Mesh Types (categorized by domain):

* Mesh
	* Normals: manual (supplied normals, can vary across the face) vs flat (calculated normals, same across the entire face)
	* Data: static (id key, used for buffer caching) vs dynamic (never cached)
	* Material: monochrome (one color, ambient/diffuse/specular are simple multipliers) vs peacock (ambient/diffuse/specular are colors)
	* Texture: textured or no texture
* World/Shader
	* Lighting: material (use material properties, normals) vs simple (no lighting)
	* Shading: interpolated (interpolated lighting vectors) vs matte (lighting calculated at center)

AbstractMesh
	triangleIndices //counterclockwise, viewed from outside
	vertices
	getTriangles
	getNormals

StaticMesh (extends AbstractMesh)
	key // if the vertices & normals data doesn't change (color/material could change)

SimpleMesh (extends StaticMesh)
	* Normals: flat
	* Data: static
	* Material: monochrome
	* Texture: none

MeshSet
	* A set of meshes, used for sprites and animations

StaticMeshFactory
	* for generating static meshes, generates unique keys/ids for each unique mesh

draw(context, parentTransform):
	if (this.mesh.key)
		context.drawStaticMesh(mesh)
	else
		context.drawMesh(mesh)

drawStaticMesh(mesh):
	if (!mesh.key) throw "Meshes must have an identifier key for caching."

	if (!verticesCache[mesh.key]):
		bindBuffer(verticesCache[mesh.key])
		bindBuffer(normalsCache[mesh.key])
	else:
		var buffer = createBuffer()
		bindBuffer(buffer)
		verticesCache[mesh.key] = mesh.getTriangles().flatten()
		bufferData(verticesCache[mesh.key])
		enableAttribPointer

		var buffer = createBuffer()
		bindBuffer(buffer)
		normalsCache[mesh.key] = mesh.getTriangles().flatten()
		bufferData(normalsCache[mesh.key])
		enableAttribPointer

