import {
  Form,
  Input,
  Avatar,
  Button,
  Space,
  Upload,
  message,
  Divider,
  Skeleton
} from "antd"
import { useState, useEffect } from "react"
import { useMessage } from "@/hooks/useMessage"
import { PageAssistDatabase } from "@/db/dexie/chat"
import { SaveButton } from "../SaveButton"
import { UploadOutlined } from "@ant-design/icons"
import { useTranslation } from "react-i18next"

type Props = {
  onSave?: () => void
}

export const ChatModelCustomization = ({ onSave }: Props) => {
  const [form] = Form.useForm()
  const { t } = useTranslation("common")
  const { historyId } = useMessage()
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      if (!historyId) {
        setIsLoading(false)
        return
      }
      try {
        const db = new PageAssistDatabase()
        const settings = await db.getChatModelSettings(historyId)
        form.setFieldsValue({
          model_display_name: settings.model_display_name || "",
          model_avatar: settings.model_avatar || ""
        })
        if (settings.model_avatar) {
          setAvatarPreview(settings.model_avatar)
        }
      } catch (error) {
        console.error("Error loading chat model settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [historyId, form])

  const handleAvatarUpload = async (file: any) => {
    // Validate file size (max 2MB)
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error("Avatar image must be smaller than 2MB!")
      return false
    }

    // Convert file to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setAvatarPreview(base64String)
      form.setFieldValue("model_avatar", base64String)
    }
    reader.readAsDataURL(file)
    return false
  }

  const handleSave = async (values: any) => {
    if (!historyId) {
      message.error("No active chat")
      return
    }

    setLoading(true)
    try {
      const db = new PageAssistDatabase()
      await db.updateChatModelSettings(
        historyId,
        values.model_avatar || undefined,
        values.model_display_name || undefined
      )
      message.success(t("saved"))
      onSave?.()
    } catch (error) {
      console.error("Error saving chat model settings:", error)
      message.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  if (!historyId) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <p className="text-sm">Start a chat to customize model appearance</p>
      </div>
    )
  }

  if (isLoading) {
    return <Skeleton active />
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Customize Model for This Chat
        </h3>
      </div>

      <Form.Item
        name="model_display_name"
        label="Custom Model Name"
        help="Leave empty to use default model name">
        <Input
          placeholder="e.g., My Custom AI Assistant"
          maxLength={100}
        />
      </Form.Item>

      <Divider />

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
          Model Avatar Image
        </label>
        <Space direction="vertical" className="w-full">
          {avatarPreview && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Preview:
              </p>
              <Avatar src={avatarPreview} size={64} />
            </div>
          )}
          <Upload
            maxCount={1}
            beforeUpload={handleAvatarUpload}
            accept="image/*"
            showUploadList={false}>
            <Button icon={<UploadOutlined />} type="default">
              {avatarPreview ? "Change Avatar" : "Upload Avatar Image"}
            </Button>
          </Upload>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Recommended: Square image, 100x100px or larger (Max: 2MB)
          </p>
        </Space>
      </div>

      <Divider />

      <SaveButton
        className="w-full"
        btnType="submit"
        loading={loading}
      />
    </Form>
  )
}
